package com.nahui.followupbussiness.tenancy.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResourceType;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanySettingsUseCase;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanySettingsStore;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import io.micrometer.core.instrument.Counter;
import java.time.Clock;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public final class CompanySettingsService implements CompanySettingsUseCase {
    private final CompanySettingsStore store;
    private final RecordAuditEntryUseCase audit;
    private final Counter updated;
    private final Counter rejected;
    private final Counter conflicts;
    private final Clock clock;

    public CompanySettingsService(CompanySettingsStore store, RecordAuditEntryUseCase audit, Counter updated,
                                  Counter rejected, Counter conflicts, Clock clock) {
        this.store = store; this.audit = audit; this.updated = updated; this.rejected = rejected;
        this.conflicts = conflicts; this.clock = clock;
    }

    @Override public Optional<Company> get(AuthenticatedActor actor) {
        return store.findActiveByTenantId(viewer(actor));
    }

    @Override public Company update(Update command, AuthenticatedActor actor) {
        UUID tenantId = admin(actor);
        if (command.geofenceRadiusPresent() || command.trackingIntervalPresent() || command.locationRetentionPresent()) {
            rejected.increment();
            throw new InvalidUpdateException();
        }
        if (command.saleEditWindowPresent() && (command.saleEditWindowMinutes() == null
                || command.saleEditWindowMinutes() < 0 || command.saleEditWindowMinutes() > 10080)) {
            rejected.increment();
            throw new InvalidUpdateException();
        }
        Company before = store.findActiveByTenantId(tenantId).orElseThrow(NotFoundException::new);
        if (command.expectedVersion() != before.version()) {
            conflicts.increment();
            throw new ConflictException();
        }
        CompanySettings previous = before.settings();
        CompanySettings next;
        try {
            next = new CompanySettings(value(command.timezone(), previous.timezone()), value(command.currency(), previous.currency()),
                    previous.geofenceRadiusMeters(), previous.trackingIntervalSeconds(), previous.locationRetentionDays(),
                    command.saleEditWindowMinutes() == null ? previous.saleEditWindowMinutes() : command.saleEditWindowMinutes());
        } catch (IllegalArgumentException exception) {
            rejected.increment();
            throw new InvalidUpdateException();
        }
        if (next.equals(previous)) return before;
        Company after = store.update(tenantId, next, command.expectedVersion(), clock.instant()).orElseThrow(() -> {
            conflicts.increment(); return new ConflictException();
        });
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.COMPANY, after.id(),
                AuditResult.SUCCESS, Map.of("operation", "COMPANY_SETTINGS_UPDATED"), Map.of("operation", "COMPANY_SETTINGS_UPDATED")))) {
            throw new IllegalStateException("audit persistence failed");
        }
        updated.increment();
        return after;
    }

    private static String value(String candidate, String current) { return candidate == null ? current : candidate; }

    private static UUID viewer(AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR && actor.role() != BaseRole.SELLER)) throw new AccessDeniedException();
        return actor.tenantId();
    }
    private static UUID admin(AuthenticatedActor actor) {
        UUID tenantId = viewer(actor);
        if (actor.role() != BaseRole.COMPANY_ADMIN) throw new AccessDeniedException();
        return tenantId;
    }
    public static final class AccessDeniedException extends RuntimeException { }
    public static final class NotFoundException extends RuntimeException { }
    public static final class ConflictException extends RuntimeException { }
    public static final class InvalidUpdateException extends RuntimeException { }
}
