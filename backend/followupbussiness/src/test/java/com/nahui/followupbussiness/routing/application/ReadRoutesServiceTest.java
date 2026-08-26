package com.nahui.followupbussiness.routing.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.ReadRoutesUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.Test;

class ReadRoutesServiceTest {
    @Test void supervisorScopeIsResolvedBeforeListAndCountAndCannotFilterAnotherSeller() {
        UUID tenant = UUID.randomUUID(), allowed = UUID.randomUUID(), outside = UUID.randomUUID();
        RouteStore routes = mock(RouteStore.class); PortfolioAccessScopeUseCase scopes = mock(PortfolioAccessScopeUseCase.class); SellerReferenceUseCase sellers = mock(SellerReferenceUseCase.class);
        var actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR);
        when(scopes.resolve(actor)).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant, false, Set.of(allowed)));
        var service = new ReadRoutesService(routes, scopes, sellers);

        assertThatThrownBy(() -> service.list(new ReadRoutesUseCase.ListQuery(null, outside, null, 0, 20), actor)).isInstanceOf(ReadRoutesUseCase.Forbidden.class);

        verify(scopes).resolve(actor); verifyNoInteractions(routes);
    }

    @Test void sellerGetsOnlyOwnPublishedDetailFromOneAuthorizedSnapshot() {
        UUID tenant = UUID.randomUUID(), account = UUID.randomUUID(), routeId = UUID.randomUUID(), seller = UUID.randomUUID();
        RouteStore routes = mock(RouteStore.class); SellerReferenceUseCase sellers = mock(SellerReferenceUseCase.class);
        var actor = new AuthenticatedActor(account, tenant, BaseRole.SELLER); Route detail = route(tenant, routeId, seller, "PUBLISHED", List.of(new Route.Point(UUID.randomUUID(), UUID.randomUUID(), 1, new GeoPoint(0, 0))));
        when(sellers.activeSellerIdsForUser(tenant, account)).thenReturn(Set.of(seller)); when(routes.findAuthorized(tenant, routeId, Set.of(seller), "PUBLISHED")).thenReturn(Optional.of(detail));

        assertThat(new ReadRoutesService(routes, mock(PortfolioAccessScopeUseCase.class), sellers).get(routeId, actor).points()).hasSize(1);

        verify(routes).findAuthorized(tenant, routeId, Set.of(seller), "PUBLISHED"); verify(routes, never()).findHeader(any(), any()); verify(routes, never()).find(any(), any());
    }

    @Test void sellerReturnsNeutralNotFoundWhenRouteChangesAfterPreviouslyAuthorizedHeader() {
        UUID tenant = UUID.randomUUID(), account = UUID.randomUUID(), routeId = UUID.randomUUID(), sellerA = UUID.randomUUID();
        RouteStore routes = mock(RouteStore.class); SellerReferenceUseCase sellers = mock(SellerReferenceUseCase.class); var actor = new AuthenticatedActor(account, tenant, BaseRole.SELLER);
        // The old two-read path could have authorized this stale header for A; the atomic lookup observes reassignment to B and returns no detail.
        when(sellers.activeSellerIdsForUser(tenant, account)).thenReturn(Set.of(sellerA));
        when(routes.findHeader(tenant, routeId)).thenReturn(Optional.of(new RouteStore.Header(routeId, tenant, sellerA, "PUBLISHED")));
        when(routes.findAuthorized(tenant, routeId, Set.of(sellerA), "PUBLISHED")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> new ReadRoutesService(routes, mock(PortfolioAccessScopeUseCase.class), sellers).get(routeId, actor)).isInstanceOf(ReadRoutesUseCase.NotFound.class);

        verify(routes).findAuthorized(tenant, routeId, Set.of(sellerA), "PUBLISHED"); verify(routes, never()).find(any(), any()); verify(routes, never()).findHeader(any(), any());
    }

    @Test void noCurrentRouteIsNeutralAndAmbiguousPublishedRoutesConflict() {
        UUID tenant = UUID.randomUUID(), account = UUID.randomUUID(), seller = UUID.randomUUID();
        RouteStore routes = mock(RouteStore.class); SellerReferenceUseCase sellers = mock(SellerReferenceUseCase.class); var actor = new AuthenticatedActor(account, tenant, BaseRole.SELLER);
        var points = List.of(new Route.Point(UUID.randomUUID(), UUID.randomUUID(), 1, new GeoPoint(0, 0)));
        when(sellers.activeSellerIdsForUser(tenant, account)).thenReturn(Set.of(seller)); when(routes.findPublishedForSellers(tenant, Set.of(seller), LocalDate.of(2026, 9, 1))).thenReturn(List.of(route(tenant, UUID.randomUUID(), seller, "PUBLISHED", points), route(tenant, UUID.randomUUID(), seller, "PUBLISHED", points)));

        assertThatThrownBy(() -> new ReadRoutesService(routes, mock(PortfolioAccessScopeUseCase.class), sellers).myRoute(LocalDate.of(2026, 9, 1), actor)).isInstanceOf(ReadRoutesUseCase.Conflict.class);
    }

    private static Route route(UUID tenant, UUID id, UUID seller, String status, List<Route.Point> points) {
        return new Route(id, tenant, "route", LocalDate.of(2026, 9, 1), seller, new GeoPoint(0, 0), points, Instant.EPOCH, Instant.EPOCH, 1, status);
    }
}
