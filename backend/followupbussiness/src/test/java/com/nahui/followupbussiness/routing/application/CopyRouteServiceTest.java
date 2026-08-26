package com.nahui.followupbussiness.routing.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.CopyRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.TerritoryReferenceUseCase;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CopyRouteServiceTest {
    @Test void copiesEligiblePointsAsIndependentDraftAndOmitsInvalidReferencesWithSafeWarnings() {
        Fixture f = fixture();
        when(f.sellers.allActive(f.tenant, Set.of(f.targetSeller))).thenReturn(true);
        when(f.sellers.allActive(f.tenant, Set.of(f.source.sellerId()))).thenReturn(false);
        when(f.customers.activeAssignedToSellerAt(f.tenant, f.targetSeller, List.of(f.activePoint.customerId(), f.inactivePoint.customerId()), f.targetDate))
                .thenReturn(List.of(new CustomerPortfolioReadUseCase.RouteCustomer(f.activePoint.customerId(), new GeoPoint(-11, -76), f.territory)));
        when(f.customers.get(eq(f.activePoint.customerId()), any())).thenReturn(Optional.of(detail(f.tenant, f.activePoint.customerId(), "ACTIVE")));
        when(f.customers.get(eq(f.inactivePoint.customerId()), any())).thenReturn(Optional.of(detail(f.tenant, f.inactivePoint.customerId(), "INACTIVE")));
        when(f.territories.activeTerritory(f.tenant, f.territory)).thenReturn(true);
        when(f.routes.reserveCopyIdempotency(eq(f.tenant), eq(f.actor.accountId()), any(), any(), any())).thenReturn(new RouteStore.Reservation(true, null, null));
        when(f.audit.record(any())).thenReturn(true);

        var result = f.service.copy(command(f), f.actor);

        assertThat(result.route().id()).isNotEqualTo(f.source.id());
        assertThat(result.route()).extracting(Route::date, Route::sellerId, Route::status, Route::version)
                .containsExactly(f.targetDate, f.targetSeller, "DRAFT", 1L);
        assertThat(result.route().points()).singleElement().satisfies(point -> {
            assertThat(point.id()).isNotEqualTo(f.activePoint.id());
            assertThat(point.sequence()).isEqualTo(1);
            assertThat(point.plannedArrivalAt()).isNull();
        });
        assertThat(result.warnings()).extracting(CopyRouteUseCase.Warning::code).containsExactly("SOURCE_SELLER_INACTIVE", "CUSTOMER_INACTIVE");
        assertThat(result.warnings().get(1).sourcePointId()).isEqualTo(f.inactivePoint.id());
        verify(f.routes).save(result.route());
        verify(f.routes).completeCopyIdempotency(eq(f.tenant), eq(f.actor.accountId()), any(), eq(result.route().id()));
    }

    @Test void createsAnEmptyDraftWhenEveryPointIsOmitted() {
        Fixture f = fixture();
        when(f.sellers.allActive(f.tenant, Set.of(f.targetSeller))).thenReturn(true);
        when(f.sellers.allActive(f.tenant, Set.of(f.source.sellerId()))).thenReturn(true);
        when(f.customers.activeAssignedToSellerAt(any(), any(), any(), any())).thenReturn(List.of());
        when(f.customers.get(any(), any())).thenReturn(Optional.of(detail(f.tenant, f.activePoint.customerId(), "ACTIVE")));
        when(f.routes.reserveCopyIdempotency(any(), any(), any(), any(), any())).thenReturn(new RouteStore.Reservation(true, null, null));
        when(f.audit.record(any())).thenReturn(true);

        var result = f.service.copy(command(f), f.actor);

        assertThat(result.route().points()).isEmpty();
        assertThat(result.warnings()).extracting(CopyRouteUseCase.Warning::code).containsOnly("CUSTOMER_OUTSIDE_TARGET_PORTFOLIO");
    }

    @Test void deniesSupervisorOutsideEitherSellerScopeForMatchingAndDifferentSourceDatesWithoutEffects() {
        Fixture f = fixture();
        var supervisor = new AuthenticatedActor(f.actor.accountId(), f.tenant, BaseRole.SUPERVISOR);
        when(f.scopes.resolve(supervisor)).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, false, Set.of(f.source.sellerId())));

        assertThatThrownBy(() -> f.service.copy(new CopyRouteUseCase.Command(f.source.id(), f.source.date(), f.targetSeller, null, UUID.randomUUID()), supervisor))
                .isInstanceOf(CopyRouteUseCase.Forbidden.class);
        assertThatThrownBy(() -> f.service.copy(command(f), supervisor)).isInstanceOf(CopyRouteUseCase.Forbidden.class);

        verify(f.routes, never()).reserveCopyIdempotency(any(), any(), any(), any(), any());
        verify(f.routes, never()).save(any());
        verifyNoInteractions(f.audit);
    }

    private static CustomerPortfolioReadUseCase.Detail detail(UUID tenant, UUID id, String status) {
        return new CustomerPortfolioReadUseCase.Detail(new Customer(id, tenant, "Customer", null, null, null, null, null, "Address", new GeoPoint(-12, -77), null, UUID.randomUUID(), status, Instant.EPOCH, Instant.EPOCH, 1), List.of());
    }
    private static CopyRouteUseCase.Command command(Fixture f) { return new CopyRouteUseCase.Command(f.source.id(), f.targetDate, f.targetSeller, null, UUID.randomUUID()); }
    private static Fixture fixture() {
        UUID tenant = UUID.randomUUID(), sourceSeller = UUID.randomUUID(), targetSeller = UUID.randomUUID(), territory = UUID.randomUUID();
        Route.Point active = new Route.Point(UUID.randomUUID(), UUID.randomUUID(), 1, new GeoPoint(-12, -77), Instant.parse("2026-09-02T08:00:00Z"), Instant.parse("2026-09-02T08:30:00Z"));
        Route.Point inactive = new Route.Point(UUID.randomUUID(), UUID.randomUUID(), 2, new GeoPoint(-13, -76));
        Route source = new Route(UUID.randomUUID(), tenant, "Source", LocalDate.of(2026, 9, 2), sourceSeller, new GeoPoint(-12, -77), List.of(active, inactive), Instant.EPOCH, Instant.EPOCH, 7, "PUBLISHED");
        RouteStore routes = mock(RouteStore.class); when(routes.find(tenant, source.id())).thenReturn(Optional.of(source));
        var actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);
        CustomerPortfolioReadUseCase customers = mock(CustomerPortfolioReadUseCase.class); SellerReferenceUseCase sellers = mock(SellerReferenceUseCase.class); TerritoryReferenceUseCase territories = mock(TerritoryReferenceUseCase.class); PortfolioAccessScopeUseCase scopes = mock(PortfolioAccessScopeUseCase.class); when(scopes.resolve(actor)).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant, true, Set.of()));
        RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        return new Fixture(tenant, targetSeller, territory, source, active, inactive, actor, routes, customers, sellers, territories, scopes, audit, new CopyRouteService(routes, customers, sellers, territories, scopes, audit, Clock.fixed(Instant.parse("2026-09-01T12:00:00Z"), ZoneOffset.UTC)), LocalDate.of(2026, 9, 3));
    }
    private record Fixture(UUID tenant, UUID targetSeller, UUID territory, Route source, Route.Point activePoint, Route.Point inactivePoint, AuthenticatedActor actor, RouteStore routes, CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers, TerritoryReferenceUseCase territories, PortfolioAccessScopeUseCase scopes, RecordAuditEntryUseCase audit, CopyRouteService service, LocalDate targetDate) { }
}
