package com.nahui.followupbussiness.routing.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import com.nahui.followupbussiness.journeys.application.port.in.JourneyStartedStatusUseCase;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.routing.application.port.in.ReorderRoutePointsUseCase;
import com.nahui.followupbussiness.routing.application.port.out.*;
import com.nahui.followupbussiness.routing.domain.*;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import java.time.*; import java.util.*; import org.junit.jupiter.api.Test;

class ReorderRoutePointsServiceTest {
 @Test void reordersCompletePermutationFromSnapshotWithoutMatrixCallAndCreatesRevision() {
  UUID tenant=UUID.randomUUID(), actor=UUID.randomUUID(), routeId=UUID.randomUUID(), seller=UUID.randomUUID(), first=UUID.randomUUID(), second=UUID.randomUUID();
  Route route=new Route(routeId,tenant,"r",LocalDate.of(2026,8,25),seller,new GeoPoint(0,0),List.of(new Route.Point(first,UUID.randomUUID(),1,new GeoPoint(1,1)),new Route.Point(second,UUID.randomUUID(),2,new GeoPoint(2,2))),Instant.EPOCH,Instant.EPOCH,1,"DRAFT");
  RouteStore routes=mock(RouteStore.class); PlanningSnapshotStore snapshots=mock(PlanningSnapshotStore.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class); RecordAuditEntryUseCase audit=mock(RecordAuditEntryUseCase.class); JourneyStartedStatusUseCase journeys=mock(JourneyStartedStatusUseCase.class); OutboxStore outbox=mock(OutboxStore.class);
  when(routes.findForUpdate(tenant,routeId)).thenReturn(Optional.of(route)); when(scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of())); when(audit.record(any())).thenReturn(true);
  var snapshot=new PlanningSnapshot(UUID.randomUUID(),tenant,routeId,1,Instant.parse("2026-08-26T00:00:00Z"),Instant.parse("2026-08-25T08:00:00Z"),Instant.parse("2026-08-25T18:00:00Z"),List.of(new PlanningSnapshot.Visit(first,60,null,null),new PlanningSnapshot.Visit(second,60,null,null)),Map.of("START:"+second,new PlanningSnapshot.Leg(60,100),second+":"+first,new PlanningSnapshot.Leg(120,100)));
  when(snapshots.findValidForUpdate(tenant,routeId,1)).thenReturn(Optional.of(snapshot));
  Route updated=new ReorderRoutePointsService(routes,snapshots,scopes,audit,journeys,outbox,Clock.fixed(Instant.parse("2026-08-25T12:00:00Z"),ZoneOffset.UTC)).reorder(new ReorderRoutePointsUseCase.Command(routeId,1,List.of(second,first),UUID.randomUUID()),new AuthenticatedActor(actor,tenant,BaseRole.COMPANY_ADMIN));
  assertThat(updated.points()).extracting(Route.Point::id).containsExactly(second,first); assertThat(updated.points()).extracting(Route.Point::sequence).containsExactly(1,2); assertThat(updated.version()).isEqualTo(2);
  verify(routes).replacePointsAndVersion(updated,1); verify(snapshots).supersedeAndCopy(snapshot,2); verify(audit).record(any());
  verifyNoInteractions(journeys,outbox);
 }
 @Test void tenantOrScopeDenialDoesNotReadSnapshotWriteOrAudit() {
  UUID tenant=UUID.randomUUID(), routeId=UUID.randomUUID(), seller=UUID.randomUUID(), point=UUID.randomUUID(); Route route=new Route(routeId,tenant,null,LocalDate.now(),seller,null,List.of(new Route.Point(point,UUID.randomUUID(),1,new GeoPoint(1,1))),Instant.EPOCH,Instant.EPOCH,1,"DRAFT");
  RouteStore routes=mock(RouteStore.class); PlanningSnapshotStore snapshots=mock(PlanningSnapshotStore.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class); RecordAuditEntryUseCase audit=mock(RecordAuditEntryUseCase.class); JourneyStartedStatusUseCase journeys=mock(JourneyStartedStatusUseCase.class); OutboxStore outbox=mock(OutboxStore.class); when(routes.findForUpdate(tenant,routeId)).thenReturn(Optional.of(route)); when(scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,false,Set.of()));
  assertThatThrownBy(()->new ReorderRoutePointsService(routes,snapshots,scopes,audit,journeys,outbox,Clock.systemUTC()).reorder(new ReorderRoutePointsUseCase.Command(routeId,1,List.of(point),UUID.randomUUID()),new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.SUPERVISOR))).isInstanceOf(ReorderRoutePointsUseCase.Forbidden.class);
  verifyNoInteractions(snapshots,audit); verify(routes,never()).replacePointsAndVersion(any(),anyLong());
  verifyNoInteractions(journeys,outbox);
 }

 @Test void reordersPublishedOnlyWhenJourneyHasNotStartedAndWritesMinimalOutboxEvent() {
  UUID tenant=UUID.randomUUID(), actor=UUID.randomUUID(), routeId=UUID.randomUUID(), seller=UUID.randomUUID(), first=UUID.randomUUID(), second=UUID.randomUUID(), correlation=UUID.randomUUID();
  Route route=new Route(routeId,tenant,"r",LocalDate.of(2026,8,25),seller,new GeoPoint(0,0),List.of(new Route.Point(first,UUID.randomUUID(),1,new GeoPoint(1,1)),new Route.Point(second,UUID.randomUUID(),2,new GeoPoint(2,2))),Instant.EPOCH,Instant.EPOCH,1,"PUBLISHED");
  RouteStore routes=mock(RouteStore.class); PlanningSnapshotStore snapshots=mock(PlanningSnapshotStore.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class); RecordAuditEntryUseCase audit=mock(RecordAuditEntryUseCase.class); JourneyStartedStatusUseCase journeys=mock(JourneyStartedStatusUseCase.class); OutboxStore outbox=mock(OutboxStore.class);
  when(routes.findForUpdate(tenant,routeId)).thenReturn(Optional.of(route)); when(scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of())); when(audit.record(any())).thenReturn(true); when(journeys.stateForUpdate(new JourneyStartedStatusUseCase.Query(tenant,seller,route.date()))).thenReturn(JourneyStartedStatusUseCase.State.NOT_STARTED);
  var snapshot=new PlanningSnapshot(UUID.randomUUID(),tenant,routeId,1,Instant.parse("2026-08-26T00:00:00Z"),Instant.parse("2026-08-25T08:00:00Z"),Instant.parse("2026-08-25T18:00:00Z"),List.of(new PlanningSnapshot.Visit(first,60,null,null),new PlanningSnapshot.Visit(second,60,null,null)),Map.of("START:"+second,new PlanningSnapshot.Leg(60,100),second+":"+first,new PlanningSnapshot.Leg(120,100)));
  when(snapshots.findValidForUpdate(tenant,routeId,1)).thenReturn(Optional.of(snapshot));
  Route updated=new ReorderRoutePointsService(routes,snapshots,scopes,audit,journeys,outbox,Clock.fixed(Instant.parse("2026-08-25T12:00:00Z"),ZoneOffset.UTC)).reorder(new ReorderRoutePointsUseCase.Command(routeId,1,List.of(second,first),correlation),new AuthenticatedActor(actor,tenant,BaseRole.COMPANY_ADMIN));
  verify(journeys).stateForUpdate(new JourneyStartedStatusUseCase.Query(tenant,seller,route.date())); verify(outbox).append(argThat(event -> event.eventType().equals("route.modified") && event.tenantId().equals(tenant) && event.correlationId().equals(correlation) && event.causationId().equals(routeId) && event.payloadJson().equals("{\"routeId\":\""+routeId+"\",\"tenantId\":\""+tenant+"\",\"routeVersion\":\"2\",\"recipientTechnicalIds\":[\""+seller+"\"]}")));
  assertThat(updated.status()).isEqualTo("PUBLISHED");
 }

 @Test void rejectsStartedOrUnavailableJourneyWithoutSnapshotWritesAuditOrOutbox() {
  UUID tenant=UUID.randomUUID(), routeId=UUID.randomUUID(), seller=UUID.randomUUID(), point=UUID.randomUUID(); Route route=new Route(routeId,tenant,"r",LocalDate.now(),seller,null,List.of(new Route.Point(point,UUID.randomUUID(),1,new GeoPoint(1,1))),Instant.EPOCH,Instant.EPOCH,1,"PUBLISHED");
  RouteStore routes=mock(RouteStore.class); PlanningSnapshotStore snapshots=mock(PlanningSnapshotStore.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class); RecordAuditEntryUseCase audit=mock(RecordAuditEntryUseCase.class); JourneyStartedStatusUseCase journeys=mock(JourneyStartedStatusUseCase.class); OutboxStore outbox=mock(OutboxStore.class); AuthenticatedActor actor=new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.COMPANY_ADMIN); ReorderRoutePointsUseCase.Command command=new ReorderRoutePointsUseCase.Command(routeId,1,List.of(point),UUID.randomUUID());
  when(routes.findForUpdate(tenant,routeId)).thenReturn(Optional.of(route)); when(scopes.resolve(actor)).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of())); when(journeys.stateForUpdate(any())).thenReturn(JourneyStartedStatusUseCase.State.STARTED);
  var service=new ReorderRoutePointsService(routes,snapshots,scopes,audit,journeys,outbox,Clock.systemUTC());
  assertThatThrownBy(()->service.reorder(command,actor)).isInstanceOf(ReorderRoutePointsUseCase.Conflict.class);
  when(journeys.stateForUpdate(any())).thenThrow(new JourneyStartedStatusUseCase.Unavailable());
  assertThatThrownBy(()->service.reorder(command,actor)).isInstanceOf(ReorderRoutePointsUseCase.Conflict.class);
  verifyNoInteractions(snapshots,audit,outbox); verify(routes,never()).replacePointsAndVersion(any(),anyLong());
 }

 @Test void auditFailurePreventsPublishedOutboxAppendSoTheEnclosingTransactionCanRollBack() {
  UUID tenant=UUID.randomUUID(), routeId=UUID.randomUUID(), seller=UUID.randomUUID(), first=UUID.randomUUID(), second=UUID.randomUUID(); Route route=new Route(routeId,tenant,"r",LocalDate.of(2026,8,25),seller,new GeoPoint(0,0),List.of(new Route.Point(first,UUID.randomUUID(),1,new GeoPoint(1,1)),new Route.Point(second,UUID.randomUUID(),2,new GeoPoint(2,2))),Instant.EPOCH,Instant.EPOCH,1,"PUBLISHED");
  RouteStore routes=mock(RouteStore.class); PlanningSnapshotStore snapshots=mock(PlanningSnapshotStore.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class); RecordAuditEntryUseCase audit=mock(RecordAuditEntryUseCase.class); JourneyStartedStatusUseCase journeys=mock(JourneyStartedStatusUseCase.class); OutboxStore outbox=mock(OutboxStore.class); AuthenticatedActor actor=new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.COMPANY_ADMIN);
  when(routes.findForUpdate(tenant,routeId)).thenReturn(Optional.of(route)); when(scopes.resolve(actor)).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of())); when(journeys.stateForUpdate(any())).thenReturn(JourneyStartedStatusUseCase.State.NOT_STARTED); when(audit.record(any())).thenReturn(false);
  var snapshot=new PlanningSnapshot(UUID.randomUUID(),tenant,routeId,1,Instant.parse("2026-08-26T00:00:00Z"),Instant.parse("2026-08-25T08:00:00Z"),Instant.parse("2026-08-25T18:00:00Z"),List.of(new PlanningSnapshot.Visit(first,60,null,null),new PlanningSnapshot.Visit(second,60,null,null)),Map.of("START:"+second,new PlanningSnapshot.Leg(60,100),second+":"+first,new PlanningSnapshot.Leg(120,100))); when(snapshots.findValidForUpdate(tenant,routeId,1)).thenReturn(Optional.of(snapshot));
  assertThatThrownBy(()->new ReorderRoutePointsService(routes,snapshots,scopes,audit,journeys,outbox,Clock.fixed(Instant.parse("2026-08-25T12:00:00Z"),ZoneOffset.UTC)).reorder(new ReorderRoutePointsUseCase.Command(routeId,1,List.of(second,first),UUID.randomUUID()),actor)).isInstanceOf(IllegalStateException.class);
  verifyNoInteractions(outbox);
 }
}
