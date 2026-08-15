package com.nahui.followupbussiness.workforce.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.Seller;
import com.nahui.followupbussiness.workforce.domain.TerritoryStatus;

import java.time.Clock;
import java.time.Instant;
import java.util.*;

import org.junit.jupiter.api.Test;

class SellerQueryServiceTest {
    private final UUID tenant = UUID.randomUUID(), otherTenant = UUID.randomUUID(), supervisor = UUID.randomUUID(), otherSupervisor = UUID.randomUUID();

    @Test
    void scopesAdminSupervisorAndSellerWithoutLeakingOtherTenantOrTeam() {
        Store store = new Store();
        Seller supervised = seller(tenant, supervisor), otherTeam = seller(tenant, otherSupervisor), foreign = seller(otherTenant, supervisor);
        store.sellers.addAll(List.of(supervised, otherTeam, foreign));
        SellerService service = new SellerService(store, null, null, Clock.systemUTC());
        var admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);
        var manager = new AuthenticatedActor(supervisor, tenant, BaseRole.SUPERVISOR);
        var seller = new AuthenticatedActor(supervised.userId(), tenant, BaseRole.SELLER);

        assertThat(service.list(null, null, null, null, 0, 20, admin).items()).containsExactlyInAnyOrder(supervised, otherTeam);
        assertThat(service.list(null, null, null, null, 0, 20, manager).items()).containsExactly(supervised);
        assertThat(service.list(null, otherSupervisor, null, null, 0, 20, manager).items()).isEmpty();
        assertThat(service.get(supervised.id(), seller)).contains(supervised);
        assertThat(service.get(otherTeam.id(), seller)).isEmpty();
        assertThat(service.get(otherTeam.id(), manager)).isEmpty();
        assertThat(service.get(foreign.id(), admin)).isEmpty();
    }

    @Test
    void deniesListingToSellerAndPlatformWithoutCallingReadPorts() {
        Store store = new Store();
        SellerService service = new SellerService(store, null, null, Clock.systemUTC());
        assertThatThrownBy(() -> service.list(null, null, null, null, 0, 20, new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SELLER))).isInstanceOf(SellerService.Forbidden.class);
        assertThatThrownBy(() -> service.get(UUID.randomUUID(), new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.PLATFORM_SUPERADMIN))).isInstanceOf(SellerService.Forbidden.class);
        assertThat(store.reads).isZero();
    }

    private Seller seller(UUID sellerTenant, UUID sellerSupervisor) {
        return new Seller(UUID.randomUUID(), sellerTenant, UUID.randomUUID(), "Seller", "seller@example.test", null, null, sellerSupervisor, List.of(), TerritoryStatus.ACTIVE, Instant.EPOCH, Instant.EPOCH, 1);
    }

    private static final class Store implements SellerStore {
        final List<Seller> sellers = new ArrayList<>();
        int reads;

        public boolean activeSupervisor(UUID t, UUID id) {
            return false;
        }

        public boolean activeTerritory(UUID t, UUID id) {
            return false;
        }

        public Seller insert(Seller seller) {
            return seller;
        }

        public Optional<Seller> find(UUID tenant, UUID id) {
            reads++;
            return sellers.stream().filter(s -> s.tenantId().equals(tenant) && s.id().equals(id)).findFirst();
        }

        public List<Seller> list(UUID tenant, UUID team, TerritoryStatus status, UUID requested, UUID territory, String search, int offset, int limit) {
            reads++;
            return sellers.stream().filter(s -> s.tenantId().equals(tenant)).filter(s -> team == null || team.equals(s.supervisorId())).filter(s -> status == null || status == s.status()).filter(s -> requested == null || requested.equals(s.supervisorId())).toList();
        }

        public long count(UUID tenant, UUID team, TerritoryStatus status, UUID requested, UUID territory, String search) {
            reads++;
            return list(tenant, team, status, requested, territory, search, 0, 0).size();
        }
    }
}
