package com.nahui.followupbussiness.workforce.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.*;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.*;

import java.time.Clock;
import java.util.*;

import org.springframework.transaction.annotation.Transactional;

public class SellerService {
    private final SellerStore store;
    private final CompanyUserService users;
    private final RecordAuditEntryUseCase audit;
    private final Clock clock;

    public SellerService(SellerStore store, CompanyUserService users, RecordAuditEntryUseCase audit, Clock clock) {
        this.store = store;
        this.users = users;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public Seller create(Command c, AuthenticatedActor actor, UUID correlationId) {
        UUID tenant = admin(actor);
        validate(c, tenant);
        CompanyUserService.User user;
        try {
            user = users.inviteSeller(new CompanyUserService.Invite(c.displayName(), c.username(), c.email(), BaseRole.SELLER), actor, correlationId);
        } catch (CompanyUserService.Conflict e) {
            throw new Conflict();
        }
        var now = clock.instant();
        Seller seller = store.insert(new Seller(UUID.randomUUID(), tenant, user.id(), clean(c.displayName()), user.email(), optional(c.phone()), optional(c.employeeCode()), c.supervisorId(), List.copyOf(c.territoryIds() == null ? List.of() : c.territoryIds()), TerritoryStatus.ACTIVE, now, now, 1));
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.SELLER, seller.id(), AuditResult.SUCCESS, Map.of(), Map.of("status", "ACTIVE"))))
            throw new IllegalStateException("Seller audit was not persisted");
        return seller;
    }

    public Optional<Seller> get(UUID sellerId, AuthenticatedActor actor) {
        if (sellerId == null) throw new Invalid();
        UUID tenant = viewer(actor);
        Optional<Seller> seller = store.find(tenant, sellerId);
        if (actor.role() == BaseRole.COMPANY_ADMIN) return seller;
        if (actor.role() == BaseRole.SELLER) return seller.filter(value -> actor.accountId().equals(value.userId()));
        return seller.filter(value -> actor.accountId().equals(value.supervisorId()));
    }

    public Page list(TerritoryStatus status, UUID requestedSupervisorId, UUID territoryId, String search, int page, int size, AuthenticatedActor actor) {
        UUID tenant = listViewer(actor);
        UUID teamSupervisor = actor.role() == BaseRole.SUPERVISOR ? actor.accountId() : null;
        if (teamSupervisor != null && requestedSupervisorId != null && !teamSupervisor.equals(requestedSupervisorId))
            return new Page(List.of(), 0);
        String query = optional(search);
        return new Page(store.list(tenant, teamSupervisor, status, requestedSupervisorId, territoryId, query, page * size, size),
                store.count(tenant, teamSupervisor, status, requestedSupervisorId, territoryId, query));
    }

    private void validate(Command c, UUID tenant) {
        if (c == null || c.email() == null || c.displayName() == null) throw new Invalid();
        if (c.supervisorId() != null && !store.activeSupervisor(tenant, c.supervisorId())) throw new Invalid();
        for (UUID id : c.territoryIds() == null ? List.<UUID>of() : c.territoryIds())
            if (id == null || !store.activeTerritory(tenant, id)) throw new Invalid();
        if (c.territoryIds() != null && new HashSet<>(c.territoryIds()).size() != c.territoryIds().size())
            throw new Invalid();
        clean(c.displayName());
    }

    private static UUID admin(AuthenticatedActor a) {
        if (a == null || a.tenantId() == null || a.role() != BaseRole.COMPANY_ADMIN) throw new Forbidden();
        return a.tenantId();
    }

    private static UUID viewer(AuthenticatedActor a) {
        if (a == null || a.tenantId() == null || a.accountId() == null || (a.role() != BaseRole.COMPANY_ADMIN && a.role() != BaseRole.SUPERVISOR && a.role() != BaseRole.SELLER))
            throw new Forbidden();
        return a.tenantId();
    }

    private static UUID listViewer(AuthenticatedActor a) {
        UUID tenant = viewer(a);
        if (a.role() == BaseRole.SELLER) throw new Forbidden();
        return tenant;
    }

    private static String clean(String v) {
        if (v == null || v.trim().length() < 2) throw new Invalid();
        return v.trim();
    }

    private static String optional(String v) {
        return v == null ? null : (v.trim().isEmpty() ? null : v.trim());
    }

    public record Command(String displayName, String username, String email, String phone, String employeeCode,
                          UUID supervisorId, List<UUID> territoryIds) {
    }

    public record Page(List<Seller> items, long total) {
    }

    public static final class Forbidden extends RuntimeException {
    }

    public static final class Conflict extends RuntimeException {
    }

    public static final class Invalid extends RuntimeException {
    }
}
