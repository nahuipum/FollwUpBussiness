package com.nahui.followupbussiness.workforce.application;

import static org.junit.jupiter.api.Assertions.*;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.Seller;
import com.nahui.followupbussiness.workforce.domain.SellerStatus;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import org.junit.jupiter.api.Test;

class SellerSupervisorAssignmentServiceTest {
    private final UUID tenant = UUID.randomUUID();
    private final UUID previousSupervisor = UUID.randomUUID();
    private final UUID nextSupervisor = UUID.randomUUID();
    private final AuthenticatedActor admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);

    @Test
    void assignsReassignsAndRemovesUsingTheCurrentTeamRelation() {
        Store store = new Store(seller(previousSupervisor, 3));
        List<RecordAuditEntryCommand> audits = new ArrayList<>();
        SellerService service = service(store, command -> { audits.add(command); return true; });

        Seller reassigned = service.assignSupervisor(store.value.id(), nextSupervisor, admin, UUID.randomUUID());
        Seller removed = service.assignSupervisor(store.value.id(), null, admin, UUID.randomUUID());
        Seller repeatedRemoval = service.assignSupervisor(store.value.id(), null, admin, UUID.randomUUID());

        assertEquals(nextSupervisor, reassigned.supervisorId());
        assertNull(removed.supervisorId());
        assertSame(removed, repeatedRemoval);
        assertEquals(2, store.writes);
        assertEquals(2, audits.size());
        assertEquals(previousSupervisor.toString(), audits.get(0).before().get("supervisorId"));
        assertEquals(nextSupervisor.toString(), audits.get(0).after().get("supervisorId"));
        assertEquals(nextSupervisor.toString(), audits.get(1).before().get("supervisorId"));
        assertEquals("NONE", audits.get(1).after().get("supervisorId"));
        assertEquals("SUPERVISOR_ASSIGNED", audits.get(0).after().get("operation"));
    }

    @Test
    void rejectsUnauthorizedCrossTenantInvalidAndConcurrentRequestsWithoutEffects() {
        Store store = new Store(seller(previousSupervisor, 1));
        int[] audits = new int[1];
        SellerService service = service(store, command -> { audits[0]++; return true; });

        assertThrows(SellerService.Forbidden.class, () -> service.assignSupervisor(store.value.id(), nextSupervisor,
                new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR), UUID.randomUUID()));
        assertThrows(SellerService.NotFound.class, () -> service.assignSupervisor(store.value.id(), nextSupervisor,
                new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), UUID.randomUUID()));
        store.activeSupervisor = false;
        assertThrows(SellerService.Invalid.class, () -> service.assignSupervisor(store.value.id(), nextSupervisor, admin, UUID.randomUUID()));
        store.activeSupervisor = true;
        store.acceptUpdate = false;
        assertThrows(SellerService.Conflict.class, () -> service.assignSupervisor(store.value.id(), nextSupervisor, admin, UUID.randomUUID()));

        assertEquals(0, store.writes);
        assertEquals(0, audits[0]);
        assertEquals(previousSupervisor, store.value.supervisorId());
    }

    @Test
    void auditFailureIsPropagatedAfterTheRelationUpdate() {
        Store store = new Store(seller(previousSupervisor, 1));
        SellerService service = service(store, command -> false);

        assertThrows(IllegalStateException.class, () -> service.assignSupervisor(store.value.id(), nextSupervisor, admin, UUID.randomUUID()));
    }

    private SellerService service(Store store, RecordAuditEntryUseCase audit) {
        return new SellerService(store, null, audit, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
    }

    private Seller seller(UUID supervisorId, long version) {
        return new Seller(UUID.randomUUID(), tenant, UUID.randomUUID(), "Seller", "seller@example.test", null, null, supervisorId,
                List.of(UUID.randomUUID()), SellerStatus.ACTIVE, Instant.EPOCH, Instant.EPOCH, version);
    }

    private final class Store implements SellerStore {
        Seller value;
        boolean activeSupervisor = true;
        boolean acceptUpdate = true;
        int writes;
        Store(Seller seller) { value = seller; }
        @Override public boolean activeSupervisor(UUID tenantId, UUID accountId) { return activeSupervisor && tenant.equals(tenantId) && nextSupervisor.equals(accountId); }
        @Override public boolean activeTerritory(UUID tenantId, UUID territoryId) { return false; }
        @Override public Seller insert(Seller seller) { return seller; }
        @Override public Optional<Seller> find(UUID tenantId, UUID sellerId) { return value.tenantId().equals(tenantId) && value.id().equals(sellerId) ? Optional.of(value) : Optional.empty(); }
        @Override public Optional<Seller> updateSupervisor(Seller seller, UUID expectedSupervisorId, long expectedVersion) {
            if (!acceptUpdate || value.version() != expectedVersion || !Objects.equals(value.supervisorId(), expectedSupervisorId)) return Optional.empty();
            writes++; value = seller; return Optional.of(seller);
        }
        @Override public List<Seller> list(UUID tenantId, UUID supervisorId, SellerStatus status, UUID requestedSupervisorId, UUID territoryId, String search, int offset, int limit) { return List.of(); }
        @Override public long count(UUID tenantId, UUID supervisorId, SellerStatus status, UUID requestedSupervisorId, UUID territoryId, String search) { return 0; }
    }
}
