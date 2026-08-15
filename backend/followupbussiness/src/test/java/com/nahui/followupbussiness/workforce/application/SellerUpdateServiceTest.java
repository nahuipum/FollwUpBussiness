package com.nahui.followupbussiness.workforce.application;

import static org.junit.jupiter.api.Assertions.*;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.Seller;
import com.nahui.followupbussiness.workforce.domain.TerritoryStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;

import org.junit.jupiter.api.Test;

class SellerUpdateServiceTest {
    private final UUID tenant = UUID.randomUUID();
    private final AuthenticatedActor admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);

    @Test
    void updatesOnlyAllowedFieldsAndPreservesRelationsAndIdentity() {
        Store store = new Store(seller(tenant, 1));
        int[] audits = new int[1];
        SellerService service = service(store, command -> {
            audits[0]++;
            return true;
        });

        Seller updated = service.update(store.value.id(), new SellerService.Update(" Nuevo nombre ", " 555 ", " EMP-2 "), 1, admin, UUID.randomUUID());

        assertEquals("Nuevo nombre", updated.displayName());
        assertEquals("555", updated.phone());
        assertEquals("EMP-2", updated.employeeCode());
        assertEquals(store.original.userId(), updated.userId());
        assertEquals(store.original.email(), updated.email());
        assertEquals(store.original.territoryIds(), updated.territoryIds());
        assertEquals(2, updated.version());
        assertEquals(1, audits[0]);
    }

    @Test
    void rejectsCrossTenantNonAdminStaleAndDuplicateWithoutWritesOrAudits() {
        Store store = new Store(seller(tenant, 1));
        int[] audits = new int[1];
        SellerService service = service(store, command -> {
            audits[0]++;
            return true;
        });
        SellerService.Update update = new SellerService.Update("Changed", null, "DUPLICATE");
        assertThrows(SellerService.Forbidden.class, () -> service.update(store.value.id(), update, 1, new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR), UUID.randomUUID()));
        assertThrows(SellerService.NotFound.class, () -> service.update(store.value.id(), update, 1, new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), UUID.randomUUID()));
        assertThrows(SellerService.Conflict.class, () -> service.update(store.value.id(), update, 0, admin, UUID.randomUUID()));
        store.duplicate = true;
        assertThrows(SellerService.Conflict.class, () -> service.update(store.value.id(), update, 1, admin, UUID.randomUUID()));
        assertEquals(1, store.employeeCodeLocks);
        assertEquals(0, store.writes);
        assertEquals(0, audits[0]);
    }

    private SellerService service(Store store, RecordAuditEntryUseCase audit) {
        return new SellerService(store, null, audit, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
    }

    private static Seller seller(UUID tenant, long version) {
        return new Seller(UUID.randomUUID(), tenant, UUID.randomUUID(), "Seller", "seller@example.test", null, "EMP-1", UUID.randomUUID(), List.of(UUID.randomUUID()), TerritoryStatus.ACTIVE, Instant.EPOCH, Instant.EPOCH, version);
    }

    private static final class Store implements SellerStore {
        final Seller original;
        Seller value;
        boolean duplicate;
        int writes;
        int employeeCodeLocks;

        Store(Seller seller) {
            original = seller;
            value = seller;
        }

        public boolean activeSupervisor(UUID tenantId, UUID accountId) {
            return false;
        }

        public boolean activeTerritory(UUID tenantId, UUID territoryId) {
            return false;
        }

        public Seller insert(Seller seller) {
            return seller;
        }

        public Optional<Seller> find(UUID tenantId, UUID sellerId) {
            return value.tenantId().equals(tenantId) && value.id().equals(sellerId) ? Optional.of(value) : Optional.empty();
        }

        public boolean existsEmployeeCode(UUID tenantId, String employeeCode, UUID excludingSellerId) {
            return duplicate;
        }

        public void lockEmployeeCode(UUID tenantId, String employeeCode) {
            employeeCodeLocks++;
        }

        public Optional<Seller> update(Seller seller, long expectedVersion) {
            if (value.version() != expectedVersion) return Optional.empty();
            writes++;
            value = seller;
            return Optional.of(seller);
        }

        public List<Seller> list(UUID tenantId, UUID supervisorId, TerritoryStatus status, UUID requestedSupervisorId, UUID territoryId, String search, int offset, int limit) {
            return List.of();
        }

        public long count(UUID tenantId, UUID supervisorId, TerritoryStatus status, UUID requestedSupervisorId, UUID territoryId, String search) {
            return 0;
        }
    }
}
