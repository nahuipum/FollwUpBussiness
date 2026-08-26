package com.nahui.followupbussiness.routing.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import com.nahui.followupbussiness.routing.application.port.in.CreateRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteStore;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class CreateRouteServiceTest {
    @Test void acceptsTheContractualBoundaryOfFiveHundredCustomers() {
        UUID tenant=UUID.randomUUID(), actorId=UUID.randomUUID(), seller=UUID.randomUUID();
        List<UUID> customerIds=java.util.stream.Stream.generate(UUID::randomUUID).limit(500).toList();
        RouteStore store=mock(RouteStore.class); CustomerPortfolioReadUseCase customers=mock(CustomerPortfolioReadUseCase.class); SellerReferenceUseCase sellers=mock(SellerReferenceUseCase.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class); RecordAuditEntryUseCase audit=mock(RecordAuditEntryUseCase.class);
        when(store.reserveIdempotency(eq(tenant),eq(actorId),any(),any(),any())).thenReturn(new RouteStore.Reservation(true,null,null)); when(sellers.allActive(tenant,Set.of(seller))).thenReturn(true); when(scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of())); when(audit.record(any())).thenReturn(true);
        when(customers.activeAssignedToSellerAt(tenant,seller,customerIds,LocalDate.of(2026,9,1))).thenReturn(customerIds.stream().map(id->new CustomerPortfolioReadUseCase.RouteCustomer(id,new GeoPoint(-12,-77),UUID.randomUUID())).toList());
        Route route=service(store,customers,sellers,scopes,audit).create(command(seller,customerIds,UUID.randomUUID()),admin(tenant,actorId));
        assertThat(route.points()).hasSize(500); verify(store).save(route);
    }
    @Test void createsSequentialDraftAndRecordsOnlyInternalAudit() {
        UUID tenant=UUID.randomUUID(), actorId=UUID.randomUUID(), seller=UUID.randomUUID(), first=UUID.randomUUID(), second=UUID.randomUUID();
        RouteStore store=mock(RouteStore.class); CustomerPortfolioReadUseCase customers=mock(CustomerPortfolioReadUseCase.class); SellerReferenceUseCase sellers=mock(SellerReferenceUseCase.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class); RecordAuditEntryUseCase audit=mock(RecordAuditEntryUseCase.class);
        when(store.reserveIdempotency(eq(tenant),eq(actorId),any(),any(),any())).thenReturn(new RouteStore.Reservation(true,null,null));
        when(sellers.allActive(tenant,Set.of(seller))).thenReturn(true); when(scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of()));
        when(customers.activeAssignedToSellerAt(tenant,seller,List.of(first,second),LocalDate.of(2026,9,1))).thenReturn(List.of(new CustomerPortfolioReadUseCase.RouteCustomer(first,new GeoPoint(-12,-77), UUID.randomUUID()),new CustomerPortfolioReadUseCase.RouteCustomer(second,new GeoPoint(-13,-76), UUID.randomUUID()))); when(audit.record(any())).thenReturn(true);
        Route result=service(store,customers,sellers,scopes,audit).create(command(seller,List.of(first,second),UUID.randomUUID()),admin(tenant,actorId));
        assertThat(result.points()).extracting(Route.Point::sequence).containsExactly(1,2); assertThat(result.points()).extracting(Route.Point::customerId).containsExactly(first,second); assertThat(result.startLocation()).isEqualTo(new GeoPoint(-11,-75)); assertThat(result.version()).isEqualTo(1);
        verify(store).save(result); verify(audit).record(argThat(a -> a.resourceType().name().equals("ROUTE") && a.after().equals(Map.of("status","DRAFT")))); verify(store).completeIdempotency(eq(tenant),eq(actorId),any(),eq(result.id()));
    }
    @Test void exactReplayReturnsOriginalAndChangedPayloadConflictsWithoutWrites() {
        UUID tenant=UUID.randomUUID(), actorId=UUID.randomUUID(), routeId=UUID.randomUUID(), seller=UUID.randomUUID(), customer=UUID.randomUUID(), key=UUID.randomUUID();
        RouteStore store=mock(RouteStore.class); CustomerPortfolioReadUseCase customers=mock(CustomerPortfolioReadUseCase.class); SellerReferenceUseCase sellers=mock(SellerReferenceUseCase.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class); Route original=new Route(routeId,tenant,null,LocalDate.of(2026,9,1),seller,null,List.of(new Route.Point(UUID.randomUUID(),customer,1,new GeoPoint(-12,-77))),Instant.EPOCH,Instant.EPOCH,1);
        when(store.reserveIdempotency(eq(tenant),eq(actorId),eq(key),any(),any())).thenAnswer(i -> new RouteStore.Reservation(false,routeId,(String)i.getArgument(3))); when(store.find(tenant,routeId)).thenReturn(Optional.of(original));
        when(sellers.allActive(tenant,Set.of(seller))).thenReturn(true); when(scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of())); when(customers.activeAssignedToSellerAt(tenant,seller,List.of(customer),LocalDate.of(2026,9,1))).thenReturn(List.of(new CustomerPortfolioReadUseCase.RouteCustomer(customer,new GeoPoint(-12,-77), UUID.randomUUID())));
        CreateRouteService service=service(store,customers,sellers,scopes,mock(RecordAuditEntryUseCase.class));
        assertThat(service.create(command(seller,List.of(customer),key),admin(tenant,actorId))).isEqualTo(original);
        when(store.reserveIdempotency(eq(tenant),eq(actorId),eq(key),any(),any())).thenReturn(new RouteStore.Reservation(false,routeId,"other"));
        assertThatThrownBy(()->service.create(command(seller,List.of(customer),key),admin(tenant,actorId))).isInstanceOf(CreateRouteUseCase.Conflict.class); verify(store,never()).save(any());
    }
    @Test void rejectsCustomerOutsideSellerPortfolioBeforeRouteWrite() {
        UUID tenant=UUID.randomUUID(), actorId=UUID.randomUUID(), seller=UUID.randomUUID(), customer=UUID.randomUUID(); RouteStore store=mock(RouteStore.class); CustomerPortfolioReadUseCase customers=mock(CustomerPortfolioReadUseCase.class); SellerReferenceUseCase sellers=mock(SellerReferenceUseCase.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class);
        when(store.reserveIdempotency(eq(tenant),eq(actorId),any(),any(),any())).thenReturn(new RouteStore.Reservation(true,null,null)); when(sellers.allActive(tenant,Set.of(seller))).thenReturn(true); when(scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of())); when(customers.activeAssignedToSellerAt(any(),any(),any(),any())).thenReturn(List.of());
        assertThatThrownBy(()->service(store,customers,sellers,scopes,mock(RecordAuditEntryUseCase.class)).create(command(seller,List.of(customer),UUID.randomUUID()),admin(tenant,actorId))).isInstanceOf(CreateRouteUseCase.Forbidden.class); verify(store,never()).save(any()); verify(store,never()).completeIdempotency(any(),any(),any(),any());
    }
    @Test void deniesExactReplayAfterSupervisorLosesSellerScopeWithoutReadingRoute() {
        UUID tenant=UUID.randomUUID(), actorId=UUID.randomUUID(), routeId=UUID.randomUUID(), seller=UUID.randomUUID(), customer=UUID.randomUUID(), key=UUID.randomUUID();
        RouteStore store=mock(RouteStore.class); CustomerPortfolioReadUseCase customers=mock(CustomerPortfolioReadUseCase.class); SellerReferenceUseCase sellers=mock(SellerReferenceUseCase.class); PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class); RecordAuditEntryUseCase audit=mock(RecordAuditEntryUseCase.class);
        when(store.reserveIdempotency(eq(tenant),eq(actorId),eq(key),any(),any())).thenAnswer(i -> new RouteStore.Reservation(false,routeId,(String)i.getArgument(3)));
        when(sellers.allActive(tenant,Set.of(seller))).thenReturn(true); when(scopes.resolve(any())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,false,Set.of()));
        assertThatThrownBy(()->service(store,customers,sellers,scopes,audit).create(command(seller,List.of(customer),key),new AuthenticatedActor(actorId,tenant,BaseRole.SUPERVISOR))).isInstanceOf(CreateRouteUseCase.Forbidden.class);
        verify(store,never()).find(any(),any()); verify(store,never()).save(any()); verify(audit,never()).record(any());
    }
    private static CreateRouteService service(RouteStore s,CustomerPortfolioReadUseCase c,SellerReferenceUseCase sellers,PortfolioAccessScopeUseCase scopes,RecordAuditEntryUseCase audit){return new CreateRouteService(s,c,sellers,scopes,audit,Clock.fixed(Instant.parse("2026-08-25T00:00:00Z"),ZoneOffset.UTC));}
    private static CreateRouteUseCase.Command command(UUID seller,List<UUID> customers,UUID key){return new CreateRouteUseCase.Command(null,LocalDate.of(2026,9,1),seller,new GeoPoint(-11,-75),customers,key);}
    private static AuthenticatedActor admin(UUID tenant,UUID actor){return new AuthenticatedActor(actor,tenant,BaseRole.COMPANY_ADMIN);}
}
