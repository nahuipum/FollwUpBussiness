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
        Seller seller = store.insert(new Seller(UUID.randomUUID(), tenant, user.id(), clean(c.displayName()), user.email(), optional(c.phone()), optional(c.employeeCode()), c.supervisorId(), List.copyOf(c.territoryIds() == null ? List.of() : c.territoryIds()), SellerStatus.INVITED, now, now, 1));
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.SELLER, seller.id(), AuditResult.SUCCESS, Map.of(), Map.of("status", SellerStatus.INVITED.name()))))
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

    @Transactional
    public Seller update(UUID sellerId, Update command, long version, AuthenticatedActor actor, UUID correlationId) {
        UUID tenant = admin(actor);
        if (sellerId == null || command == null || !command.hasChanges()) throw new Invalid();
        Seller before = store.find(tenant, sellerId).orElseThrow(NotFound::new);
        if (version != before.version()) throw new Conflict();
        String displayName = command.displayName() == null ? before.displayName() : clean(command.displayName());
        String phone = command.phone() == null ? before.phone() : optional(command.phone());
        String employeeCode = command.employeeCode() == null ? before.employeeCode() : optional(command.employeeCode());
        if (command.employeeCode() != null && employeeCode != null && !employeeCode.equalsIgnoreCase(before.employeeCode())) {
            store.lockEmployeeCode(tenant, employeeCode);
            if (store.existsEmployeeCode(tenant, employeeCode, sellerId)) throw new Conflict();
        }
        if (before.displayName().equals(displayName) && Objects.equals(before.phone(), phone) && Objects.equals(before.employeeCode(), employeeCode))
            return before;
        Seller after = new Seller(before.id(), tenant, before.userId(), displayName, before.email(), phone, employeeCode, before.supervisorId(), before.territoryIds(), before.status(), before.createdAt(), clock.instant(), before.version() + 1);
        Seller saved = store.update(after, version).orElseThrow(Conflict::new);
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.SELLER, sellerId, AuditResult.SUCCESS, Map.of(), Map.of("operation", "PROFILE_UPDATED"))))
            throw new IllegalStateException("Seller audit was not persisted");
        return saved;
    }

    @Transactional
    public Seller status(UUID sellerId, SellerStatus target, String reason, AuthenticatedActor actor, UUID correlationId) {
        UUID tenant = admin(actor);
        if (sellerId == null || target == null || reason == null || reason.trim().length() < 5 || reason.trim().length() > 500)
            throw new Invalid();
        Seller before = store.find(tenant, sellerId).orElseThrow(NotFound::new);
        if (before.status() == target) throw new Conflict();
        SellerStatus effectiveTarget = target == SellerStatus.ACTIVE && before.status() == SellerStatus.INVITED
                ? SellerStatus.INVITED : target;
        try {
            effectiveTarget = SellerStatus.valueOf(users.status(before.userId(), effectiveTarget.name(), actor, correlationId).status());
        } catch (CompanyUserService.Conflict | CompanyUserService.NotFound exception) {
            throw new Conflict();
        }
        Seller after = new Seller(before.id(), tenant, before.userId(), before.displayName(), before.email(), before.phone(), before.employeeCode(),
                before.supervisorId(), before.territoryIds(), effectiveTarget, before.createdAt(), clock.instant(), before.version() + 1);
        Seller saved = store.updateStatus(after, before.status()).orElseThrow(Conflict::new);
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.SELLER, sellerId, AuditResult.SUCCESS,
                Map.of("status", before.status().name()), Map.of("status", effectiveTarget.name(), "reason", "PROVIDED"))))
            throw new IllegalStateException("Seller status audit was not persisted");
        return saved;
    }

    @Transactional
    public Seller resendInvitation(UUID sellerId, long version, AuthenticatedActor actor, UUID correlationId) {
        UUID tenant = admin(actor);
        Seller before = store.find(tenant, sellerId).orElseThrow(NotFound::new);
        if (before.status() != SellerStatus.INVITED || before.version() != version) throw new Conflict();
        try {
            users.resendSellerInvitation(before.userId(), actor, correlationId);
        } catch (CompanyUserService.Conflict | CompanyUserService.NotFound exception) {
            throw new Conflict();
        }
        Seller after = new Seller(before.id(), tenant, before.userId(), before.displayName(), before.email(), before.phone(), before.employeeCode(),
                before.supervisorId(), before.territoryIds(), before.status(), before.createdAt(), clock.instant(), before.version() + 1);
        return store.updateStatus(after, before.status()).orElseThrow(Conflict::new);
    }

    @Transactional
    public Seller assignSupervisor(UUID sellerId, UUID supervisorId, AuthenticatedActor actor, UUID correlationId) {
        UUID tenant = admin(actor);
        if (sellerId == null) throw new Invalid();
        Seller before = store.find(tenant, sellerId).orElseThrow(NotFound::new);
        if (Objects.equals(before.supervisorId(), supervisorId)) return before;
        if (supervisorId != null && !store.activeSupervisor(tenant, supervisorId)) throw new Invalid();
        Seller after = new Seller(before.id(), tenant, before.userId(), before.displayName(), before.email(), before.phone(), before.employeeCode(),
                supervisorId, before.territoryIds(), before.status(), before.createdAt(), clock.instant(), before.version() + 1);
        Seller saved = store.updateSupervisor(after, before.supervisorId(), before.version()).orElseThrow(Conflict::new);
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.SELLER, sellerId, AuditResult.SUCCESS,
                Map.of("supervisorId", auditValue(before.supervisorId())), Map.of("supervisorId", auditValue(supervisorId), "operation", "SUPERVISOR_ASSIGNED"))))
            throw new IllegalStateException("Seller supervisor audit was not persisted");
        return saved;
    }

    @Transactional
    public Seller assignTerritories(UUID sellerId, List<UUID> territoryIds, AuthenticatedActor actor, UUID correlationId) {
        UUID tenant = admin(actor);
        if (sellerId == null || territoryIds == null || territoryIds.isEmpty() || territoryIds.stream().anyMatch(Objects::isNull)
                || new HashSet<>(territoryIds).size() != territoryIds.size()) throw new Invalid();
        Seller before = store.find(tenant, sellerId).orElseThrow(NotFound::new);
        before.requireActiveForAssignment();
        List<UUID> requested = List.copyOf(territoryIds);
        for (UUID territoryId : requested)
            if (!store.activeTerritory(tenant, territoryId)) {
                if (!store.territoryBelongsToTenant(tenant, territoryId)) throw new NotFound();
                throw new Invalid();
            }
        if (new HashSet<>(before.territoryIds()).equals(new HashSet<>(requested))) return before;
        Seller after = new Seller(before.id(), tenant, before.userId(), before.displayName(), before.email(), before.phone(), before.employeeCode(),
                before.supervisorId(), requested, before.status(), before.createdAt(), clock.instant(), before.version() + 1);
        Seller saved = store.replaceTerritories(after, before.version()).orElseThrow(Conflict::new);
        if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.SELLER, sellerId, AuditResult.SUCCESS,
                Map.of("territoryIds", territoryAuditValue(before.territoryIds())), Map.of("territoryIds", territoryAuditValue(requested)))))
            throw new IllegalStateException("Seller territory audit was not persisted");
        return saved;
    }

    public Page list(SellerStatus status, UUID requestedSupervisorId, UUID territoryId, String search, int page, int size, AuthenticatedActor actor) {
        UUID tenant = listViewer(actor);
        UUID teamSupervisor = actor.role() == BaseRole.SUPERVISOR ? actor.accountId() : null;
        if (teamSupervisor != null && requestedSupervisorId != null && !teamSupervisor.equals(requestedSupervisorId))
            return new Page(List.of(), 0);
        String query = optional(search);
        return new Page(store.list(tenant, teamSupervisor, status, requestedSupervisorId, territoryId, query, page * size, size),
                store.count(tenant, teamSupervisor, status, requestedSupervisorId, territoryId, query));
    }

    public Map<UUID, SellerStore.SellerReferences> references(List<Seller> sellers, AuthenticatedActor actor) {
        return store.references(listViewer(actor), sellers);
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

    private static String auditValue(UUID value) {
        return value == null ? "NONE" : value.toString();
    }

    private static String territoryAuditValue(List<UUID> territoryIds) {
        return territoryIds.isEmpty() ? "NONE" : territoryIds.stream().map(UUID::toString).sorted().collect(java.util.stream.Collectors.joining(","));
    }

    public record Command(String displayName, String username, String email, String phone, String employeeCode,
                          UUID supervisorId, List<UUID> territoryIds) {
    }

    public record Update(String displayName, String phone, String employeeCode) {
        public boolean hasChanges() {
            return displayName != null || phone != null || employeeCode != null;
        }
    }

    public record Page(List<Seller> items, long total) {
    }

    public static final class Forbidden extends RuntimeException {
    }

    public static final class Conflict extends RuntimeException {
    }

    public static final class NotFound extends RuntimeException {
    }

    public static final class Invalid extends RuntimeException {
    }
}
