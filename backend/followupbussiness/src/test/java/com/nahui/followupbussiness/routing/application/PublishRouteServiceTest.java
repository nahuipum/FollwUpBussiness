package com.nahui.followupbussiness.routing.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.routing.application.port.in.PublishRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.PlanningSnapshotStore;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.PlanningSnapshot;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PublishRouteServiceTest {
    @Test void mapsDurablePublishedSellerDayConflictWithoutAuditOrEvent() {
        Fixture f = fixture();
        when(f.routes.findForUpdate(f.tenant, f.route.id())).thenReturn(Optional.of(f.route));
        when(f.scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, true, Set.of()));
        when(f.sellers.allActive(f.tenant, Set.of(f.route.sellerId()))).thenReturn(true);
        when(f.routes.reservePublicationIdempotency(eq(f.tenant), eq(f.actor.accountId()), any(), any(), any())).thenReturn(new RouteStore.Reservation(true, null, null));
        when(f.snapshots.findValidForUpdate(f.tenant, f.route.id(), 1)).thenReturn(Optional.of(snapshot(f)));
        doThrow(new RouteStore.Conflict()).when(f.routes).publish(any(), anyLong());

        assertThatThrownBy(() -> f.service.publish(command(f, true), f.actor)).isInstanceOf(PublishRouteUseCase.Conflict.class);

        verifyNoInteractions(f.outbox, f.audit); verify(f.routes, never()).completePublicationIdempotency(any(), any(), any(), any());
    }
    @Test void publishesDraftWithMatchingValidSnapshotAuditAndTransactionalOutboxEvenWhenPushIsDisabled() {
        Fixture f = fixture();
        when(f.routes.findForUpdate(f.tenant, f.route.id())).thenReturn(Optional.of(f.route));
        when(f.scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, true, Set.of()));
        when(f.sellers.allActive(f.tenant, Set.of(f.route.sellerId()))).thenReturn(true);
        when(f.routes.reservePublicationIdempotency(eq(f.tenant), eq(f.actor.accountId()), any(), any(), any())).thenReturn(new RouteStore.Reservation(true, null, null));
        when(f.snapshots.findValidForUpdate(f.tenant, f.route.id(), 1)).thenReturn(Optional.of(snapshot(f)));
        when(f.audit.record(any())).thenReturn(true);

        Route result = f.service.publish(command(f, false), f.actor);

        assertThat(result.status()).isEqualTo("PUBLISHED");
        assertThat(result.version()).isEqualTo(2);
        verify(f.routes).publish(result, 1);
        verify(f.audit).record(argThat(a -> a.before().get("status").equals("DRAFT") && a.after().get("status").equals("PUBLISHED")));
        verify(f.outbox).append(argThat(event -> event.eventType().equals("route.published") && event.version() == 1
                && event.tenantId().equals(f.tenant) && event.causationId().equals(f.route.id())
                && event.payloadJson().contains("\"recipientTechnicalIds\":[\"" + f.route.sellerId() + "\"]")
                && event.payloadJson().contains("\"notifySeller\":false")));
        verify(f.routes).completePublicationIdempotency(eq(f.tenant), eq(f.actor.accountId()), any(), eq(f.route.id()));
    }

    @Test void exactReplayReturnsPublishedRouteWithoutSecondEventAuditOrWrite() {
        Fixture f = fixture();
        Route published = new Route(f.route.id(), f.tenant, f.route.name(), f.route.date(), f.route.sellerId(), f.route.startLocation(), f.route.points(), f.route.createdAt(), f.route.updatedAt(), 2, "PUBLISHED");
        when(f.routes.findForUpdate(f.tenant, f.route.id())).thenReturn(Optional.of(published));
        when(f.scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, true, Set.of()));
        when(f.sellers.allActive(f.tenant, Set.of(f.route.sellerId()))).thenReturn(true);
        when(f.routes.reservePublicationIdempotency(eq(f.tenant), eq(f.actor.accountId()), any(), any(), any()))
                .thenAnswer(invocation -> new RouteStore.Reservation(false, f.route.id(), (String) invocation.getArgument(3)));

        assertThat(f.service.publish(command(f, true), f.actor)).isEqualTo(published);

        verify(f.routes, never()).publish(any(), anyLong());
        verifyNoInteractions(f.snapshots, f.outbox, f.audit);
    }

    @Test void rejectsInactiveSellerOrMissingSnapshotWithoutSuccessfulEffects() {
        Fixture f = fixture();
        when(f.routes.findForUpdate(f.tenant, f.route.id())).thenReturn(Optional.of(f.route));
        when(f.scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, true, Set.of()));
        when(f.sellers.allActive(f.tenant, Set.of(f.route.sellerId()))).thenReturn(false);

        assertThatThrownBy(() -> f.service.publish(command(f, true), f.actor)).isInstanceOf(PublishRouteUseCase.Forbidden.class);
        verifyNoInteractions(f.snapshots, f.outbox, f.audit);
        verify(f.routes, never()).reservePublicationIdempotency(any(), any(), any(), any(), any());

        reset(f.sellers, f.routes, f.scopes);
        when(f.routes.findForUpdate(f.tenant, f.route.id())).thenReturn(Optional.of(f.route));
        when(f.scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, true, Set.of()));
        when(f.sellers.allActive(f.tenant, Set.of(f.route.sellerId()))).thenReturn(true);
        when(f.routes.reservePublicationIdempotency(any(), any(), any(), any(), any())).thenReturn(new RouteStore.Reservation(true, null, null));
        when(f.snapshots.findValidForUpdate(f.tenant, f.route.id(), 1)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> f.service.publish(command(f, true), f.actor)).isInstanceOf(PublishRouteUseCase.Conflict.class);
        verifyNoInteractions(f.outbox, f.audit);
        verify(f.routes, never()).publish(any(), anyLong());
    }

    @Test void deniesSupervisorOutsideCurrentSellerScopeBeforeIdempotencyOrWrites() {
        Fixture f = fixture();
        AuthenticatedActor supervisor = new AuthenticatedActor(f.actor.accountId(), f.tenant, BaseRole.SUPERVISOR);
        when(f.routes.findForUpdate(f.tenant, f.route.id())).thenReturn(Optional.of(f.route));
        when(f.scopes.resolve(supervisor)).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, false, Set.of()));

        assertThatThrownBy(() -> f.service.publish(command(f, true), supervisor)).isInstanceOf(PublishRouteUseCase.Forbidden.class);

        verify(f.routes, never()).reservePublicationIdempotency(any(), any(), any(), any(), any());
        verifyNoInteractions(f.snapshots, f.outbox, f.audit, f.sellers);
    }

    private static PlanningSnapshot snapshot(Fixture f) {
        UUID point = f.route.points().getFirst().id();
        return new PlanningSnapshot(UUID.randomUUID(), f.tenant, f.route.id(), 1, Instant.parse("2026-09-02T00:00:00Z"), Instant.parse("2026-09-01T08:00:00Z"), Instant.parse("2026-09-01T18:00:00Z"), List.of(new PlanningSnapshot.Visit(point, 60, null, null)), Map.of("START:" + point, new PlanningSnapshot.Leg(60, 100)));
    }

    private static PublishRouteUseCase.Command command(Fixture f, boolean notifySeller) {
        return new PublishRouteUseCase.Command(f.route.id(), 1, UUID.randomUUID(), notifySeller, UUID.randomUUID());
    }

    private static Fixture fixture() {
        UUID tenant = UUID.randomUUID(), seller = UUID.randomUUID(), actor = UUID.randomUUID(), routeId = UUID.randomUUID();
        Route route = new Route(routeId, tenant, "Route", LocalDate.of(2026, 9, 1), seller, new GeoPoint(-12, -77), List.of(new Route.Point(UUID.randomUUID(), UUID.randomUUID(), 1, new GeoPoint(-12, -77))), Instant.EPOCH, Instant.EPOCH, 1, "DRAFT");
        RouteStore routes = mock(RouteStore.class); PlanningSnapshotStore snapshots = mock(PlanningSnapshotStore.class); SellerReferenceUseCase sellers = mock(SellerReferenceUseCase.class); PortfolioAccessScopeUseCase scopes = mock(PortfolioAccessScopeUseCase.class); OutboxStore outbox = mock(OutboxStore.class); RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        return new Fixture(tenant, route, new AuthenticatedActor(actor, tenant, BaseRole.COMPANY_ADMIN), routes, snapshots, sellers, scopes, outbox, audit,
                new PublishRouteService(routes, snapshots, sellers, scopes, outbox, audit, Clock.fixed(Instant.parse("2026-09-01T12:00:00Z"), ZoneOffset.UTC)));
    }

    private record Fixture(UUID tenant, Route route, AuthenticatedActor actor, RouteStore routes, PlanningSnapshotStore snapshots,
                           SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes, OutboxStore outbox,
                           RecordAuditEntryUseCase audit, PublishRouteService service) { }
}
