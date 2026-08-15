package com.nahui.followupbussiness.workforce.application;

import static org.junit.jupiter.api.Assertions.*;

import com.nahui.followupbussiness.identityaccess.domain.model.*;
import com.nahui.followupbussiness.workforce.application.port.out.TerritoryStore;
import com.nahui.followupbussiness.workforce.domain.*;

import java.time.*;
import java.util.*;

import org.junit.jupiter.api.Test;

class TerritoryServiceTest {
    private final UUID tenant = UUID.randomUUID();
    private final AuthenticatedActor admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);

    @Test
    void createsTenantBoundTerritoryAndRejectsDuplicateName() {
        var store = new MemoryStore();
        var service = new TerritoryService(store, c -> true, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
        var created = service.create(" Norte ", "N", null, admin);
        assertEquals(tenant, created.tenantId());
        assertEquals("Norte", created.name());
        assertThrows(TerritoryService.ConflictException.class, () -> service.create("norte", "OTHER", null, admin));
    }

    @Test
    void patchWithoutChangesDoesNotWriteOrAudit() {
        var store = new MemoryStore();
        var audits = new int[1];
        var service = new TerritoryService(store, c -> {
            audits[0]++;
            return true;
        }, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
        var created = service.create("North", "N", null, admin);
        var result = service.update(created.id(), "North", "N", null, TerritoryStatus.ACTIVE, 1, admin);
        assertEquals(1, result.version());
        assertEquals(1, audits[0]);
        assertEquals(0, store.updates);
    }

    @Test
    void supervisorCanReadButCannotMutateAndCannotReadAnotherTenant() {
        var store = new MemoryStore();
        var service = new TerritoryService(store, c -> true, Clock.systemUTC());
        var supervisor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR);
        assertTrue(service.list(null, null, 0, 20, supervisor).items().isEmpty());
        assertThrows(TerritoryService.AccessDeniedException.class, () -> service.create("North", null, null, supervisor));
        var other = service.create("Other", null, null, new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN));
        assertTrue(service.get(other.id(), supervisor).isEmpty());
    }

    private static final class MemoryStore implements TerritoryStore {
        final Map<UUID, Territory> data = new HashMap<>();
        int updates;

        public Optional<Territory> find(UUID t, UUID id) {
            return Optional.ofNullable(data.get(id)).filter(x -> x.tenantId().equals(t));
        }

        public List<Territory> list(UUID t, TerritoryStatus s, String q, int o, int n) {
            return data.values().stream().filter(x -> x.tenantId().equals(t) && (s == null || x.status() == s)).toList();
        }

        public long count(UUID t, TerritoryStatus s, String q) {
            return list(t, s, q, 0, 0).size();
        }

        public boolean existsName(UUID t, String n, UUID e) {
            return data.values().stream().anyMatch(x -> x.tenantId().equals(t) && x.name().equalsIgnoreCase(n) && !x.id().equals(e));
        }

        public boolean existsCode(UUID t, String c, UUID e) {
            return data.values().stream().anyMatch(x -> x.tenantId().equals(t) && x.code() != null && x.code().equalsIgnoreCase(c) && !x.id().equals(e));
        }

        public Territory insert(Territory x) {
            data.put(x.id(), x);
            return x;
        }

        public Optional<Territory> update(Territory x, long v) {
            updates++;
            if (!data.containsKey(x.id()) || data.get(x.id()).version() != v) return Optional.empty();
            data.put(x.id(), x);
            return Optional.of(x);
        }
    }
}
