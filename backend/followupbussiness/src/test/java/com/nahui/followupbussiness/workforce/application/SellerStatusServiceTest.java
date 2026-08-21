package com.nahui.followupbussiness.workforce.application;

import static org.junit.jupiter.api.Assertions.*;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.Seller;
import com.nahui.followupbussiness.workforce.domain.SellerStatus;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SellerStatusServiceTest {
    private final UUID tenant = UUID.randomUUID();
    private final AuthenticatedActor admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);

    @Test
    void inactivationRevokesThroughIdentityAndPreservesSellerRelations() {
        Store store = new Store(seller(SellerStatus.ACTIVE, 4));
        Users users = new Users();
        RecordAuditEntryCommand[] audit = new RecordAuditEntryCommand[1];

        Seller changed = service(store, users, command -> { audit[0] = command; return true; })
                .status(store.value.id(), SellerStatus.INACTIVE, "offboarding approved", admin, UUID.randomUUID());

        assertEquals(SellerStatus.INACTIVE, changed.status());
        assertEquals(store.original.userId(), changed.userId());
        assertEquals(store.original.supervisorId(), changed.supervisorId());
        assertEquals(store.original.territoryIds(), changed.territoryIds());
        assertEquals(5, changed.version());
        assertEquals("INACTIVE", users.target);
        assertEquals(1, store.statusWrites);
        assertEquals("ACTIVE", audit[0].before().get("status"));
        assertEquals("INACTIVE", audit[0].after().get("status"));
        assertEquals("PROVIDED", audit[0].after().get("reason"));
    }

    @Test
    void rejectsUnauthorizedCrossTenantRepeatedAndInvalidWithoutIdentityWritesOrAudit() {
        Store store = new Store(seller(SellerStatus.ACTIVE, 1));
        Users users = new Users();
        int[] audits = new int[1];
        SellerService service = service(store, users, command -> { audits[0]++; return true; });

        assertThrows(SellerService.Forbidden.class, () -> service.status(store.value.id(), SellerStatus.INACTIVE, "valid reason", new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR), UUID.randomUUID()));
        assertThrows(SellerService.NotFound.class, () -> service.status(store.value.id(), SellerStatus.INACTIVE, "valid reason", new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), UUID.randomUUID()));
        assertThrows(SellerService.Invalid.class, () -> service.status(store.value.id(), SellerStatus.INACTIVE, "bad", admin, UUID.randomUUID()));
        store.value = seller(SellerStatus.INACTIVE, 1);
        assertThrows(SellerService.Conflict.class, () -> service.status(store.value.id(), SellerStatus.INACTIVE, "valid reason", admin, UUID.randomUUID()));

        assertEquals(0, users.calls);
        assertEquals(0, store.statusWrites);
        assertEquals(0, audits[0]);
    }

    @Test
    void concurrentStatusWriteConflictDoesNotAudit() {
        Store store = new Store(seller(SellerStatus.ACTIVE, 1));
        store.acceptStatusUpdate = false;
        Users users = new Users();
        int[] audits = new int[1];

        assertThrows(SellerService.Conflict.class, () -> service(store, users, command -> { audits[0]++; return true; })
                .status(store.value.id(), SellerStatus.INACTIVE, "valid reason", admin, UUID.randomUUID()));

        assertEquals(1, users.calls);
        assertEquals(0, audits[0]);
    }

    @Test
    void inactiveSellerRejectsFutureAssignmentBeforeAnyWrite() {
        Seller inactive = seller(SellerStatus.INACTIVE, 1);
        int[] writes = new int[1];

        assertThrows(Seller.InactiveForAssignment.class, () -> {
            inactive.requireActiveForAssignment();
            writes[0]++;
        });

        assertEquals(0, writes[0]);
    }

    private SellerService service(Store store, Users users, RecordAuditEntryUseCase audit) {
        return new SellerService(store, users, audit, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
    }

    private Seller seller(SellerStatus status, long version) {
        return new Seller(UUID.randomUUID(), tenant, UUID.randomUUID(), "Seller", "seller@example.test", "555", "EMP-1", UUID.randomUUID(), List.of(UUID.randomUUID()), status, Instant.EPOCH, Instant.EPOCH, version);
    }

    private static final class Users extends CompanyUserService {
        int calls;
        String target;
        Users() { super(null, Clock.systemUTC()); }
        @Override public User status(UUID id, String target, AuthenticatedActor actor, UUID correlationId) {
            calls++;
            this.target = target;
            return new User(id, "Seller", "seller", "seller@example.test", BaseRole.SELLER, target, Instant.EPOCH, Instant.EPOCH, 1);
        }
    }

    private static final class Store implements SellerStore {
        final Seller original;
        Seller value;
        int statusWrites;
        boolean acceptStatusUpdate = true;
        Store(Seller seller) { original = seller; value = seller; }
        @Override public boolean activeSupervisor(UUID tenantId, UUID accountId) { return false; }
        @Override public boolean activeTerritory(UUID tenantId, UUID territoryId) { return false; }
        @Override public Seller insert(Seller seller) { return seller; }
        @Override public Optional<Seller> find(UUID tenantId, UUID sellerId) { return value.tenantId().equals(tenantId) && value.id().equals(sellerId) ? Optional.of(value) : Optional.empty(); }
        @Override public Optional<Seller> updateStatus(Seller seller, SellerStatus expectedStatus) {
            if (!acceptStatusUpdate || value.status() != expectedStatus) return Optional.empty();
            statusWrites++; value = seller; return Optional.of(seller);
        }
        @Override public List<Seller> list(UUID tenantId, UUID supervisorId, SellerStatus status, UUID requestedSupervisorId, UUID territoryId, String search, int offset, int limit) { return List.of(); }
        @Override public long count(UUID tenantId, UUID supervisorId, SellerStatus status, UUID requestedSupervisorId, UUID territoryId, String search) { return 0; }
    }
}
