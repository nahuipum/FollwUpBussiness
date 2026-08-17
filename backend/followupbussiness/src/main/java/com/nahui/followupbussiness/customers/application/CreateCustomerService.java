package com.nahui.followupbussiness.customers.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResourceType;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.time.Clock;
import java.util.Map;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

public class CreateCustomerService {
    private final CustomerStore store;
    private final RecordAuditEntryUseCase audit;
    private final Clock clock;
    public CreateCustomerService(CustomerStore store, RecordAuditEntryUseCase audit, Clock clock) { this.store = store; this.audit = audit; this.clock = clock; }

    @Transactional
    public Customer create(Command command, AuthenticatedActor actor) {
        UUID tenant = tenant(actor);
        if (command.territoryId() != null && !store.activeTerritory(tenant, command.territoryId())) throw new InvalidTerritory();
        var now = clock.instant();
        Customer customer = new Customer(UUID.randomUUID(), tenant, clean(command.name()), optional(command.documentType()), optional(command.documentNumber()), optional(command.phone()), optional(command.email()), clean(command.address()), command.location(), command.visitFrequencyDays(), command.territoryId(), "ACTIVE", now, now, 1);
        Customer saved = store.insert(customer);
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.CUSTOMER, saved.id(), AuditResult.SUCCESS, Map.of(), Map.of("status", "ACTIVE")))) throw new IllegalStateException("audit persistence failed");
        return saved;
    }
    private static UUID tenant(AuthenticatedActor actor) { if (actor == null || actor.tenantId() == null || actor.role() != BaseRole.COMPANY_ADMIN) throw new Forbidden(); return actor.tenantId(); }
    private static String clean(String value) { if (value == null || value.trim().isEmpty()) throw new Invalid(); return value.trim(); }
    private static String optional(String value) { return value == null || value.trim().isEmpty() ? null : value.trim(); }
    public record Command(String name, String documentType, String documentNumber, String phone, String email, String address, GeoPoint location, Integer visitFrequencyDays, UUID territoryId) {}
    public static final class Forbidden extends RuntimeException {}
    public static final class Invalid extends RuntimeException {}
    public static final class InvalidTerritory extends RuntimeException {}
}
