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
import com.nahui.followupbussiness.routing.application.port.in.ReassignRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ReassignRouteServiceTest {
    @Test void reassignsPublishedRouteWithAuditAndTransactionalEventWithoutLeakingReason() {
        Fixture f = fixture("PUBLISHED");
        arrangeAuthorizedOwner(f);

        Route result = f.service.reassign(command(f), f.admin);

        assertThat(result.sellerId()).isEqualTo(f.newSeller);
        assertThat(result.status()).isEqualTo("PUBLISHED");
        assertThat(result.version()).isEqualTo(2);
        verify(f.routes).reassign(result, 1);
        verify(f.audit).record(argThat(a -> !a.before().containsKey("reason") && a.after().get("sellerId").equals(f.newSeller.toString())));
        verify(f.outbox).append(argThat(e -> e.eventType().equals("route.reassigned") && e.tenantId().equals(f.tenant)
                && e.payloadJson().contains("\"recipientTechnicalIds\":[\"" + f.newSeller + "\"]") && !e.payloadJson().contains("operational reason")));
        verify(f.routes).completeReassignmentIdempotency(eq(f.tenant), eq(f.admin.accountId()), any(), eq(f.route.id()));
    }

    @Test void rejectsInProgressRouteWithoutMutationEventAuditOrIdempotencyCompletion() {
        Fixture f = fixture("IN_PROGRESS");
        arrangeAuthorizedOwner(f);

        assertThatThrownBy(() -> f.service.reassign(command(f), f.admin)).isInstanceOf(ReassignRouteUseCase.Conflict.class);

        verify(f.routes, never()).reassign(any(), anyLong());
        verifyNoInteractions(f.outbox, f.audit);
        verify(f.routes, never()).completeReassignmentIdempotency(any(), any(), any(), any());
    }

    @Test void deniesSupervisorWhenEitherSellerIsOutsideCurrentTeamBeforeEffects() {
        Fixture f = fixture("PUBLISHED");
        AuthenticatedActor supervisor = new AuthenticatedActor(f.admin.accountId(), f.tenant, BaseRole.SUPERVISOR);
        when(f.routes.findForUpdate(f.tenant, f.route.id())).thenReturn(Optional.of(f.route));
        when(f.scopes.resolve(supervisor)).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, false, Set.of(f.route.sellerId())));

        assertThatThrownBy(() -> f.service.reassign(command(f), supervisor)).isInstanceOf(ReassignRouteUseCase.Forbidden.class);

        verify(f.routes, never()).reserveReassignmentIdempotency(any(), any(), any(), any(), any());
        verifyNoInteractions(f.sellers, f.outbox, f.audit);
    }

    @Test void exactReplayReturnsRouteWithoutSecondWriteOrEvent() {
        Fixture f = fixture("PUBLISHED");
        Route alreadyReassigned = route(f.tenant, f.route.id(), f.newSeller, "PUBLISHED", 2);
        when(f.routes.findForUpdate(f.tenant, f.route.id())).thenReturn(Optional.of(alreadyReassigned));
        when(f.scopes.resolve(f.admin)).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, true, Set.of()));
        when(f.sellers.allActive(f.tenant, Set.of(f.newSeller))).thenReturn(true);
        when(f.routes.reserveReassignmentIdempotency(eq(f.tenant), eq(f.admin.accountId()), any(), any(), any()))
                .thenAnswer(i -> new RouteStore.Reservation(false, f.route.id(), i.getArgument(3)));

        assertThat(f.service.reassign(command(f), f.admin)).isEqualTo(alreadyReassigned);

        verify(f.routes, never()).reassign(any(), anyLong());
        verifyNoInteractions(f.outbox, f.audit);
    }

    private static void arrangeAuthorizedOwner(Fixture f) {
        when(f.routes.findForUpdate(f.tenant, f.route.id())).thenReturn(Optional.of(f.route));
        when(f.scopes.resolve(f.admin)).thenReturn(new PortfolioAccessScopeUseCase.Scope(f.tenant, true, Set.of()));
        when(f.sellers.allActive(f.tenant, Set.of(f.route.sellerId(), f.newSeller))).thenReturn(true);
        when(f.routes.reserveReassignmentIdempotency(eq(f.tenant), eq(f.admin.accountId()), any(), any(), any())).thenReturn(new RouteStore.Reservation(true, null, null));
        when(f.audit.record(any())).thenReturn(true);
    }

    private static ReassignRouteUseCase.Command command(Fixture f) {
        return new ReassignRouteUseCase.Command(f.route.id(), f.newSeller, "operational reason", 1, UUID.randomUUID(), UUID.randomUUID());
    }

    private static Fixture fixture(String status) {
        UUID tenant = UUID.randomUUID(), oldSeller = UUID.randomUUID(), newSeller = UUID.randomUUID(), routeId = UUID.randomUUID();
        Route route = route(tenant, routeId, oldSeller, status, 1);
        RouteStore routes = mock(RouteStore.class); SellerReferenceUseCase sellers = mock(SellerReferenceUseCase.class);
        PortfolioAccessScopeUseCase scopes = mock(PortfolioAccessScopeUseCase.class); OutboxStore outbox = mock(OutboxStore.class); RecordAuditEntryUseCase audit = mock(RecordAuditEntryUseCase.class);
        AuthenticatedActor admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);
        return new Fixture(tenant, route, newSeller, admin, routes, sellers, scopes, outbox, audit,
                new ReassignRouteService(routes, sellers, scopes, outbox, audit, Clock.fixed(Instant.parse("2026-09-01T12:00:00Z"), ZoneOffset.UTC)));
    }

    private static Route route(UUID tenant, UUID routeId, UUID seller, String status, long version) {
        return new Route(routeId, tenant, "Route", LocalDate.of(2026, 9, 1), seller, new GeoPoint(-12, -77), List.of(new Route.Point(UUID.randomUUID(), UUID.randomUUID(), 1, new GeoPoint(-12, -77))), Instant.EPOCH, Instant.EPOCH, version, status);
    }

    private record Fixture(UUID tenant, Route route, UUID newSeller, AuthenticatedActor admin, RouteStore routes,
                           SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes, OutboxStore outbox, RecordAuditEntryUseCase audit,
                           ReassignRouteService service) { }
}
