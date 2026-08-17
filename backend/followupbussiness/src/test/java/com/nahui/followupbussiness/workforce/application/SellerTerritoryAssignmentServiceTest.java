package com.nahui.followupbussiness.workforce.application;

import static org.junit.jupiter.api.Assertions.*;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
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

class SellerTerritoryAssignmentServiceTest {
    private final UUID tenant = UUID.randomUUID();
    private final AuthenticatedActor admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);

    @Test
    void replacesTheWholeTerritorySetAndAuditsOnlyTheBeforeAfterIdentifiers() {
        UUID oldTerritory = UUID.randomUUID();
        UUID firstRequested = UUID.randomUUID();
        UUID secondRequested = UUID.randomUUID();
        Store store = new Store(seller(List.of(oldTerritory), TerritoryStatus.ACTIVE, 4), Set.of(firstRequested, secondRequested));
        List<RecordAuditEntryCommand> audits = new ArrayList<>();

        Seller result = service(store, command -> { audits.add(command); return true; })
                .assignTerritories(store.value.id(), List.of(firstRequested, secondRequested), admin, UUID.randomUUID());

        assertEquals(List.of(firstRequested, secondRequested), result.territoryIds());
        assertEquals(5, result.version());
        assertEquals(1, store.writes);
        assertEquals(1, audits.size());
        assertEquals(oldTerritory.toString(), audits.getFirst().before().get("territoryIds"));
        assertEquals(List.of(firstRequested, secondRequested).stream().map(UUID::toString).sorted().collect(java.util.stream.Collectors.joining(",")), audits.getFirst().after().get("territoryIds"));
    }

    @Test
    void rejectsUnauthorizedCrossTenantDuplicateInactiveAndConcurrentRequestsWithoutEffects() {
        UUID oldTerritory = UUID.randomUUID();
        UUID requested = UUID.randomUUID();
        Store store = new Store(seller(List.of(oldTerritory), TerritoryStatus.ACTIVE, 1), Set.of(requested));
        UUID foreignTerritory = UUID.randomUUID();
        store.tenantTerritories = Set.of(requested);
        int[] audits = new int[1];
        SellerService service = service(store, command -> { audits[0]++; return true; });

        assertThrows(SellerService.Forbidden.class, () -> service.assignTerritories(store.value.id(), List.of(requested), new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR), UUID.randomUUID()));
        assertThrows(SellerService.NotFound.class, () -> service.assignTerritories(store.value.id(), List.of(requested), new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), UUID.randomUUID()));
        assertThrows(SellerService.NotFound.class, () -> service.assignTerritories(store.value.id(), List.of(foreignTerritory), admin, UUID.randomUUID()));
        assertThrows(SellerService.Invalid.class, () -> service.assignTerritories(store.value.id(), List.of(requested, requested), admin, UUID.randomUUID()));
        store.activeTerritories = Set.of();
        store.tenantTerritories = Set.of(requested);
        assertThrows(SellerService.Invalid.class, () -> service.assignTerritories(store.value.id(), List.of(requested), admin, UUID.randomUUID()));
        store.activeTerritories = Set.of(requested);
        store.acceptReplace = false;
        assertThrows(SellerService.Conflict.class, () -> service.assignTerritories(store.value.id(), List.of(requested), admin, UUID.randomUUID()));

        assertEquals(List.of(oldTerritory), store.value.territoryIds());
        assertEquals(0, store.writes);
        assertEquals(0, audits[0]);
    }

    @Test
    void doesNotWriteOrAuditWhenTheSameTerritorySetIsRepeatedOrSellerIsInactive() {
        UUID territory = UUID.randomUUID();
        Store store = new Store(seller(List.of(territory), TerritoryStatus.ACTIVE, 1), Set.of(territory));
        int[] audits = new int[1];
        SellerService service = service(store, command -> { audits[0]++; return true; });

        assertSame(store.value, service.assignTerritories(store.value.id(), List.of(territory), admin, UUID.randomUUID()));
        store.value = seller(List.of(territory), TerritoryStatus.INACTIVE, 1);
        assertThrows(Seller.InactiveForAssignment.class, () -> service.assignTerritories(store.value.id(), List.of(UUID.randomUUID()), admin, UUID.randomUUID()));

        assertEquals(0, store.writes);
        assertEquals(0, audits[0]);
    }

    private SellerService service(Store store, RecordAuditEntryUseCase audit) {
        return new SellerService(store, null, audit, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
    }

    private Seller seller(List<UUID> territories, TerritoryStatus status, long version) {
        return new Seller(UUID.randomUUID(), tenant, UUID.randomUUID(), "Seller", "seller@example.test", null, null, null,
                territories, status, Instant.EPOCH, Instant.EPOCH, version);
    }

    private final class Store implements SellerStore {
        Seller value;
        Set<UUID> activeTerritories;
        Set<UUID> tenantTerritories;
        boolean acceptReplace = true;
        int writes;
        Store(Seller seller, Set<UUID> activeTerritories) { this.value = seller; this.activeTerritories = activeTerritories; this.tenantTerritories = activeTerritories; }
        @Override public boolean activeSupervisor(UUID tenantId, UUID accountId) { return false; }
        @Override public boolean activeTerritory(UUID tenantId, UUID territoryId) { return tenant.equals(tenantId) && activeTerritories.contains(territoryId); }
        @Override public boolean territoryBelongsToTenant(UUID tenantId, UUID territoryId) { return tenant.equals(tenantId) && tenantTerritories.contains(territoryId); }
        @Override public Seller insert(Seller seller) { return seller; }
        @Override public Optional<Seller> find(UUID tenantId, UUID sellerId) { return tenant.equals(tenantId) && value.id().equals(sellerId) ? Optional.of(value) : Optional.empty(); }
        @Override public Optional<Seller> replaceTerritories(Seller seller, long expectedVersion) {
            if (!acceptReplace || value.version() != expectedVersion) return Optional.empty();
            writes++; value = seller; return Optional.of(seller);
        }
        @Override public List<Seller> list(UUID tenantId, UUID supervisorId, TerritoryStatus status, UUID requestedSupervisorId, UUID territoryId, String search, int offset, int limit) { return List.of(); }
        @Override public long count(UUID tenantId, UUID supervisorId, TerritoryStatus status, UUID requestedSupervisorId, UUID territoryId, String search) { return 0; }
    }
}
