package com.nahui.followupbussiness.notifications.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.notifications.application.port.in.ConsumeRouteNotificationUseCase;
import com.nahui.followupbussiness.notifications.application.port.out.NotificationDeliveryStore;
import com.nahui.followupbussiness.notifications.application.port.out.RoutePushGateway;
import com.nahui.followupbussiness.routing.application.port.in.RouteNotificationAuthorizationUseCase;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ConsumeRouteNotificationServiceTest {
    @Test void reservesBeforeGenericPushAndNeverDuplicatesRedelivery() {
        Fixture f = fixture(); when(f.routes.isAuthorized(f.tenant, f.route, 2, f.user)).thenReturn(true);
        when(f.store.findActiveInstallation(f.tenant, f.user)).thenReturn(Optional.of(new NotificationDeliveryStore.Installation(UUID.randomUUID(), f.tenant, f.user, UUID.randomUUID(), "double", "opaque")));
        when(f.store.reserve(any(), any(), any(), any(), any())).thenReturn(true, false);
        when(f.gateway.send(any())).thenReturn(RoutePushGateway.Result.DELIVERED);
        f.service.consume(f.command(true)); f.service.consume(f.command(true));
        verify(f.gateway, times(1)).send(argThat(p -> p.title().equals("Nueva actualización") && p.body().equals("Abre la aplicación para ver los cambios.")));
        verify(f.store).delivered(any(), any(), any(), any(), any());
    }
    @Test void suppressesPushWhenNotifySellerFalseButStillRevalidates() {
        Fixture f=fixture(); when(f.routes.isAuthorized(f.tenant,f.route,2,f.user)).thenReturn(true);
        f.service.consume(f.command(false)); verify(f.routes).isAuthorized(f.tenant,f.route,2,f.user); verify(f.store).findActiveInstallation(f.tenant, f.user); verifyNoInteractions(f.gateway);
    }
    @Test void deniesWrongTenantOrExpiredEventWithoutEffects() {
        Fixture f=fixture(); f.service.consume(new ConsumeRouteNotificationUseCase.Command(UUID.randomUUID(),"route.published",1,Instant.parse("2026-08-24T11:00:00Z"),f.tenant,UUID.randomUUID(),f.route,2,f.user,true));
        verifyNoInteractions(f.routes,f.store,f.gateway);
    }
    @Test void invalidTokenRevokesBindingAndTransientFailureIsRetriable() {
        Fixture f=fixture(); when(f.routes.isAuthorized(any(),any(),anyLong(),any())).thenReturn(true);
        var i=new NotificationDeliveryStore.Installation(UUID.randomUUID(),f.tenant,f.user,UUID.randomUUID(),"double","opaque"); when(f.store.findActiveInstallation(any(),any())).thenReturn(Optional.of(i)); when(f.store.reserve(any(),any(),any(),any(),any())).thenReturn(true); when(f.gateway.send(any())).thenReturn(RoutePushGateway.Result.INVALID_TOKEN);
        f.service.consume(f.command(true)); verify(f.store).revoke(eq(i.id()),any());
    }
    @Test void reclaimsTheSameDeliveryAfterTransientFailureWithoutDuplicatingItsKey() {
        Fixture f=fixture(); var command=f.command(true); when(f.routes.isAuthorized(any(),any(),anyLong(),any())).thenReturn(true);
        when(f.store.findActiveInstallation(any(),any())).thenReturn(Optional.of(new NotificationDeliveryStore.Installation(UUID.randomUUID(),f.tenant,f.user,UUID.randomUUID(),"double","opaque")));
        when(f.store.reserve(any(),any(),any(),any(),any())).thenReturn(true, true);
        when(f.gateway.send(any())).thenReturn(RoutePushGateway.Result.TRANSIENT_FAILURE, RoutePushGateway.Result.DELIVERED);
        assertThatThrownBy(() -> f.service.consume(command)).isInstanceOf(ConsumeRouteNotificationService.TransientPushFailure.class);
        f.service.consume(command);
        verify(f.store).retryable(eq(f.tenant), eq(command.eventId()), eq(f.user), eq("route.published"), any());
        verify(f.gateway, times(2)).send(any());
        verify(f.store).delivered(eq(f.tenant), eq(command.eventId()), eq(f.user), eq("route.published"), any());
    }
    private static Fixture fixture() { UUID t=UUID.randomUUID(), r=UUID.randomUUID(),u=UUID.randomUUID(); var s=mock(NotificationDeliveryStore.class); var a=mock(RouteNotificationAuthorizationUseCase.class); var g=mock(RoutePushGateway.class); return new Fixture(t,r,u,s,a,g,new ConsumeRouteNotificationService(s,a,g,Clock.fixed(Instant.parse("2026-08-25T12:00:00Z"),ZoneOffset.UTC),Duration.ofMinutes(5))); }
    private record Fixture(UUID tenant,UUID route,UUID user,NotificationDeliveryStore store,RouteNotificationAuthorizationUseCase routes,RoutePushGateway gateway,ConsumeRouteNotificationService service) { ConsumeRouteNotificationUseCase.Command command(boolean notify) { return new ConsumeRouteNotificationUseCase.Command(UUID.randomUUID(),"route.published",1,Instant.parse("2026-08-25T11:00:00Z"),tenant,UUID.randomUUID(),route,2,user,notify); } }
}
