package com.nahui.followupbussiness.tenancy.application;

import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAuditCommand;
import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAuditCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.ChangeCompanyStatusUseCase;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyStatusStore;
import java.time.Clock;
import java.util.Map;
import java.util.UUID;

public final class ChangeCompanyStatusService implements ChangeCompanyStatusUseCase {
    static final String REASON_PROVIDED = "REASON_PROVIDED";
    private final CompanyStatusStore store;
    private final RecordPlatformCompanyAuditUseCase audit;
    private final RecordCompanyDenialAuditUseCase denialAudit;
    private final Clock clock;

    public ChangeCompanyStatusService(CompanyStatusStore store, RecordPlatformCompanyAuditUseCase audit,
            RecordCompanyDenialAuditUseCase denialAudit, Clock clock) {
        this.store = store;
        this.audit = audit;
        this.denialAudit = denialAudit;
        this.clock = clock;
    }

    @Override
    public Result execute(UUID companyId, ChangeCompanyStatusCommand command, AuthenticatedActor actor) {
        if (actor == null) throw new AccessDeniedException();
        if (actor.role() != BaseRole.PLATFORM_SUPERADMIN || actor.tenantId() != null) {
            if (actor.tenantId() == null) {
                audit.record(new RecordPlatformCompanyAuditCommand(companyId, AuditAction.CRITICAL_MUTATION,
                        AuditResult.DENIED, Map.of(), Map.of(), null));
            } else {
                denialAudit.record(new RecordCompanyDenialAuditCommand(UUID.randomUUID(), companyId,
                        AuditAction.CRITICAL_MUTATION));
            }
            return Result.deniedResult();
        }

        return store.changeStatus(companyId, command.status(), clock.instant()).map(transition -> {
            if (transition.changed()) {
                audit.record(new RecordPlatformCompanyAuditCommand(companyId, AuditAction.CRITICAL_MUTATION,
                        AuditResult.SUCCESS, Map.of("status", transition.before().status().name()),
                        Map.of("status", transition.after().status().name()), reasonProvided(command.reason())));
            }
            return Result.success(transition.after());
        }).orElseGet(Result::notFound);
    }

    static String reasonProvided(String reason) {
        return REASON_PROVIDED;
    }

    public static final class AccessDeniedException extends RuntimeException { }
}
