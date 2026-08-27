package com.nahui.followupbussiness.routing.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.ReadRoutesUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteDirections;
import com.nahui.followupbussiness.routing.domain.Route;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class GetRouteDirectionsServiceTest {
    @Test void previewsAuthorizedCompletePermutationWithoutPersistingRoute() {
        var reads = mock(ReadRoutesUseCase.class); var provider = mock(RouteDirections.class); UUID routeId = UUID.randomUUID(), tenant = UUID.randomUUID();
        var actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR);
        UUID first = UUID.randomUUID(), second = UUID.randomUUID();
        Route route = new Route(routeId, tenant, "manual", LocalDate.now(), UUID.randomUUID(), null, List.of(
                new Route.Point(first, UUID.randomUUID(), 1, new GeoPoint(1, 1)),
                new Route.Point(second, UUID.randomUUID(), 2, new GeoPoint(2, 2))), Instant.EPOCH, Instant.EPOCH, 4, "DRAFT");
        var expected = new RouteDirections.Directions(List.of(new GeoPoint(2, 2), new GeoPoint(1, 1)), List.of(), 1, 2);
        when(reads.get(routeId, actor)).thenReturn(route); when(provider.calculate(anyList())).thenReturn(expected);

        assertThat(new GetRouteDirectionsService(reads, provider).preview(
                new com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Preview(routeId, 4, List.of(second, first)), actor)).isEqualTo(expected);

        verify(provider).calculate(List.of(new GeoPoint(2, 2), new GeoPoint(1, 1)));
        verifyNoMoreInteractions(provider);
    }

    @Test void rejectsStaleOrIncompletePreviewBeforeProviderCall() {
        var reads = mock(ReadRoutesUseCase.class); var provider = mock(RouteDirections.class); UUID routeId = UUID.randomUUID(), tenant = UUID.randomUUID();
        var actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);
        UUID first = UUID.randomUUID(), second = UUID.randomUUID();
        Route route = new Route(routeId, tenant, "manual", LocalDate.now(), UUID.randomUUID(), null, List.of(
                new Route.Point(first, UUID.randomUUID(), 1, new GeoPoint(1, 1)), new Route.Point(second, UUID.randomUUID(), 2, new GeoPoint(2, 2))), Instant.EPOCH, Instant.EPOCH, 4, "DRAFT");
        when(reads.get(routeId, actor)).thenReturn(route);
        var service = new GetRouteDirectionsService(reads, provider);

        assertThatThrownBy(() -> service.preview(new com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Preview(routeId, 3, List.of(first, second)), actor))
                .isInstanceOf(com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Conflict.class);
        assertThatThrownBy(() -> service.preview(new com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Preview(routeId, 4, List.of(first)), actor))
                .isInstanceOf(com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Invalid.class);
        verifyNoInteractions(provider);
    }

    @Test void rejectsPreviewForNonDraftOrUnauthorizedActorBeforeProviderCall() {
        var reads = mock(ReadRoutesUseCase.class); var provider = mock(RouteDirections.class); UUID routeId = UUID.randomUUID(), tenant = UUID.randomUUID();
        UUID first = UUID.randomUUID(), second = UUID.randomUUID();
        Route published = new Route(routeId, tenant, "route", LocalDate.now(), UUID.randomUUID(), null, List.of(
                new Route.Point(first, UUID.randomUUID(), 1, new GeoPoint(1, 1)), new Route.Point(second, UUID.randomUUID(), 2, new GeoPoint(2, 2))), Instant.EPOCH, Instant.EPOCH, 1, "PUBLISHED");
        var admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);
        when(reads.get(routeId, admin)).thenReturn(published);
        var service = new GetRouteDirectionsService(reads, provider);

        assertThatThrownBy(() -> service.preview(new com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Preview(routeId, 1, List.of(first, second)), admin))
                .isInstanceOf(com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Conflict.class);
        var seller = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SELLER);
        assertThatThrownBy(() -> service.preview(new com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Preview(routeId, 1, List.of(first, second)), seller))
                .isInstanceOf(ReadRoutesUseCase.Forbidden.class);
        verifyNoInteractions(provider);
    }

    @Test void authorizesBeforeProviderAndCachesByRouteVersion() {
        var reads = mock(ReadRoutesUseCase.class); var provider = mock(RouteDirections.class); UUID routeId = UUID.randomUUID(), tenant = UUID.randomUUID();
        var actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR); var route = route(routeId, tenant, 1);
        var expected = new RouteDirections.Directions(List.of(new GeoPoint(0, 0)), List.of(), 1, 2);
        when(reads.get(routeId, actor)).thenReturn(route); when(provider.calculate(anyList())).thenReturn(expected);
        var service = new GetRouteDirectionsService(reads, provider);

        assertThat(service.get(routeId, actor)).isEqualTo(expected);
        assertThat(service.get(routeId, actor)).isEqualTo(expected);

        verify(provider, times(1)).calculate(List.of(new GeoPoint(0, 0), new GeoPoint(1, 1)));
    }

    @Test void usesFirstOrderedVisitAsOriginWhenNoExplicitOriginExists() {
        var reads = mock(ReadRoutesUseCase.class); var provider = mock(RouteDirections.class); UUID routeId = UUID.randomUUID(), tenant = UUID.randomUUID();
        var actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR);
        var route = route(routeId, tenant, 1, null, List.of(new GeoPoint(1, 1), new GeoPoint(2, 2)));
        var expected = new RouteDirections.Directions(List.of(new GeoPoint(1, 1), new GeoPoint(2, 2)), List.of(), 1, 2);
        when(reads.get(routeId, actor)).thenReturn(route); when(provider.calculate(anyList())).thenReturn(expected);

        assertThat(new GetRouteDirectionsService(reads, provider).get(routeId, actor)).isEqualTo(expected);

        verify(provider).calculate(List.of(new GeoPoint(1, 1), new GeoPoint(2, 2)));
    }

    @Test void singleVisitWithoutExplicitOriginDoesNotCallProviderForInventedNavigation() {
        var reads = mock(ReadRoutesUseCase.class); var provider = mock(RouteDirections.class); UUID routeId = UUID.randomUUID(), tenant = UUID.randomUUID();
        var actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR);
        when(reads.get(routeId, actor)).thenReturn(route(routeId, tenant, 1, null, List.of(new GeoPoint(1, 1))));

        assertThatThrownBy(() -> new GetRouteDirectionsService(reads, provider).get(routeId, actor))
                .isInstanceOf(com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Invalid.class);

        verifyNoInteractions(provider);
    }

    @Test void moreThanFiftyVisitsDoesNotCallProvider() {
        var reads = mock(ReadRoutesUseCase.class); var provider = mock(RouteDirections.class); UUID routeId = UUID.randomUUID(), tenant = UUID.randomUUID();
        var actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR);
        List<GeoPoint> points = java.util.stream.IntStream.range(0, 51).mapToObj(index -> new GeoPoint(index, index)).toList();
        when(reads.get(routeId, actor)).thenReturn(route(routeId, tenant, 1, null, points));

        assertThatThrownBy(() -> new GetRouteDirectionsService(reads, provider).get(routeId, actor))
                .isInstanceOf(com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Invalid.class);

        verifyNoInteractions(provider);
    }

    @Test void crossTenantOrUnauthorizedRouteNeverCallsProvider() {
        var reads = mock(ReadRoutesUseCase.class); var provider = mock(RouteDirections.class); UUID routeId = UUID.randomUUID();
        var actor = new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.SUPERVISOR);
        when(reads.get(routeId, actor)).thenThrow(new ReadRoutesUseCase.NotFound());

        assertThatThrownBy(() -> new GetRouteDirectionsService(reads, provider).get(routeId, actor)).isInstanceOf(ReadRoutesUseCase.NotFound.class);
        verifyNoInteractions(provider);
    }

    @Test void providerFailureIsTypedWithoutChangingRoute() {
        var reads = mock(ReadRoutesUseCase.class); var provider = mock(RouteDirections.class); UUID routeId = UUID.randomUUID(), tenant = UUID.randomUUID();
        var actor = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);
        when(reads.get(routeId, actor)).thenReturn(route(routeId, tenant, 1)); when(provider.calculate(anyList())).thenThrow(new GetRouteDirectionsService.RouteDirectionsUnavailable());

        assertThatThrownBy(() -> new GetRouteDirectionsService(reads, provider).get(routeId, actor)).isInstanceOf(com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase.Unavailable.class);
    }

    private static Route route(UUID id, UUID tenant, long version) {
        return route(id, tenant, version, new GeoPoint(0, 0), List.of(new GeoPoint(1, 1)));
    }

    private static Route route(UUID id, UUID tenant, long version, GeoPoint start, List<GeoPoint> locations) {
        List<Route.Point> points = java.util.stream.IntStream.range(0, locations.size())
                .mapToObj(index -> new Route.Point(UUID.randomUUID(), UUID.randomUUID(), index + 1, locations.get(index))).toList();
        return new Route(id, tenant, "manual", LocalDate.now(), UUID.randomUUID(), start, points, Instant.EPOCH, Instant.EPOCH, version, "DRAFT");
    }
}
