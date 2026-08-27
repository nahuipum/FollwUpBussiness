package com.nahui.followupbussiness.routing.adapter.in.rest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.CopyRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.CreateRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ListSuggestedCustomersUseCase;
import com.nahui.followupbussiness.routing.application.port.in.PublishRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ReadRoutesUseCase;
import com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteDirections;
import com.nahui.followupbussiness.routing.application.port.in.ReassignRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ReorderRoutePointsUseCase;
import com.nahui.followupbussiness.routing.domain.Route;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class RouteControllerTest {
    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void returnsAuthorizedCustomerNamesForRoutePointsInOneBatch() throws Exception {
        UUID tenant = UUID.randomUUID(), account = UUID.randomUUID(), routeId = UUID.randomUUID();
        UUID firstCustomer = UUID.randomUUID(), secondCustomer = UUID.randomUUID();
        AuthenticatedActor actor = new AuthenticatedActor(account, tenant, BaseRole.SUPERVISOR);
        ReadRoutesUseCase reads = mock(ReadRoutesUseCase.class);
        CustomerPortfolioReadUseCase customers = mock(CustomerPortfolioReadUseCase.class);
        Route route = new Route(routeId, tenant, "Route", LocalDate.of(2026, 8, 26), UUID.randomUUID(), new GeoPoint(-12, -77), List.of(
                new Route.Point(UUID.randomUUID(), firstCustomer, 1, new GeoPoint(-12.1, -77.1)),
                new Route.Point(UUID.randomUUID(), secondCustomer, 2, new GeoPoint(-12.2, -77.2))), Instant.EPOCH, Instant.EPOCH, 1, "DRAFT");
        when(reads.get(routeId, actor)).thenReturn(route);
        when(customers.routeCustomerNames(tenant, List.of(firstCustomer, secondCustomer))).thenReturn(List.of(
                new CustomerPortfolioReadUseCase.RouteCustomerName(firstCustomer, "Cliente uno"),
                new CustomerPortfolioReadUseCase.RouteCustomerName(secondCustomer, "Cliente dos")));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(actor, null));
        var mvc = MockMvcBuilders.standaloneSetup(controller(reads, customers))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();

        mvc.perform(get("/routes/{routeId}", routeId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.points[0].customerName").value("Cliente uno"))
                .andExpect(jsonPath("$.points[1].customerName").value("Cliente dos"));

        verify(reads).get(routeId, actor);
        verify(customers).routeCustomerNames(tenant, List.of(firstCustomer, secondCustomer));
    }

    @Test
    void returnsNeutralDirectionsAndSafeProviderFailure() throws Exception {
        UUID tenant = UUID.randomUUID(), account = UUID.randomUUID(), routeId = UUID.randomUUID();
        AuthenticatedActor actor = new AuthenticatedActor(account, tenant, BaseRole.SUPERVISOR);
        ReadRoutesUseCase reads = mock(ReadRoutesUseCase.class); CustomerPortfolioReadUseCase customers = mock(CustomerPortfolioReadUseCase.class);
        GetRouteDirectionsUseCase directions = mock(GetRouteDirectionsUseCase.class);
        when(directions.get(routeId, actor)).thenReturn(new RouteDirections.Directions(List.of(new GeoPoint(-12, -77)), List.of(new RouteDirections.Leg(10, 2, List.of(new RouteDirections.Instruction("Continue", 10, 2)))), 10, 2));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(actor, null));
        var mvc = MockMvcBuilders.standaloneSetup(controller(reads, directions, customers)).setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();

        mvc.perform(get("/routes/{routeId}/directions", routeId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.distanceMeters").value(10)).andExpect(jsonPath("$.legs[0].instructions[0].text").value("Continue"));
        when(directions.get(routeId, actor)).thenThrow(new GetRouteDirectionsUseCase.Unavailable());
        mvc.perform(get("/routes/{routeId}/directions", routeId)).andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("DIRECTIONS_UNAVAILABLE"));
    }

    @Test
    void mapsStaleOrNonDraftDirectionsPreviewToConflictWithoutLeakingRouteDetails() throws Exception {
        UUID tenant = UUID.randomUUID(), account = UUID.randomUUID(), routeId = UUID.randomUUID();
        AuthenticatedActor actor = new AuthenticatedActor(account, tenant, BaseRole.COMPANY_ADMIN);
        ReadRoutesUseCase reads = mock(ReadRoutesUseCase.class); CustomerPortfolioReadUseCase customers = mock(CustomerPortfolioReadUseCase.class);
        GetRouteDirectionsUseCase directions = mock(GetRouteDirectionsUseCase.class);
        when(directions.preview(any(), eq(actor))).thenThrow(new GetRouteDirectionsUseCase.Conflict());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(actor, null));
        var mvc = MockMvcBuilders.standaloneSetup(controller(reads, directions, customers)).setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();

        mvc.perform(post("/routes/{routeId}/directions/preview", routeId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"baseRouteVersion\":1,\"routePointIds\":[\"" + UUID.randomUUID() + "\"]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Request cannot be processed"));
        verify(directions).preview(any(), eq(actor));
    }

    @Test
    void acceptsTheCompleteOpaquePointPermutationSentByTheRouteEditor() throws Exception {
        UUID tenant = UUID.randomUUID(), account = UUID.randomUUID(), routeId = UUID.randomUUID();
        UUID seller = UUID.randomUUID(), firstPoint = UUID.randomUUID(), secondPoint = UUID.randomUUID();
        UUID firstCustomer = UUID.randomUUID(), secondCustomer = UUID.randomUUID();
        AuthenticatedActor actor = new AuthenticatedActor(account, tenant, BaseRole.COMPANY_ADMIN);
        Route updated = new Route(routeId, tenant, "Ruta", LocalDate.of(2026, 8, 26), seller, null, List.of(
                new Route.Point(secondPoint, secondCustomer, 1, new GeoPoint(-12.2, -77.2)),
                new Route.Point(firstPoint, firstCustomer, 2, new GeoPoint(-12.1, -77.1))),
                Instant.EPOCH, Instant.EPOCH, 2, "DRAFT");
        ReadRoutesUseCase reads = mock(ReadRoutesUseCase.class);
        CustomerPortfolioReadUseCase customers = mock(CustomerPortfolioReadUseCase.class);
        ReorderRoutePointsUseCase reorder = mock(ReorderRoutePointsUseCase.class);
        when(reorder.reorder(any(), eq(actor))).thenReturn(updated);
        when(customers.routeCustomerNames(tenant, List.of(secondCustomer, firstCustomer))).thenReturn(List.of(
                new CustomerPortfolioReadUseCase.RouteCustomerName(secondCustomer, "Segundo"),
                new CustomerPortfolioReadUseCase.RouteCustomerName(firstCustomer, "Primero")));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(actor, null));
        var mvc = MockMvcBuilders.standaloneSetup(controller(reads, mock(GetRouteDirectionsUseCase.class), customers, reorder))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();

        mvc.perform(put("/routes/{routeId}/points/order", routeId)
                        .header("If-Match", "\"1\"").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"routePointIds\":[\"" + secondPoint + "\",\"" + firstPoint + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.points[0].id").value(secondPoint.toString()))
                .andExpect(jsonPath("$.points[0].customerName").value("Segundo"));

        verify(reorder).reorder(argThat(command -> command.routeId().equals(routeId)
                && command.baseRouteVersion() == 1
                && command.routePointIds().equals(List.of(secondPoint, firstPoint))
                && command.correlationId() != null), eq(actor));
    }

    private RouteController controller(ReadRoutesUseCase reads, CustomerPortfolioReadUseCase customers) {
        return controller(reads, mock(GetRouteDirectionsUseCase.class), customers);
    }
    private RouteController controller(ReadRoutesUseCase reads, GetRouteDirectionsUseCase directions, CustomerPortfolioReadUseCase customers) {
        return controller(reads, directions, customers, mock(ReorderRoutePointsUseCase.class));
    }
    private RouteController controller(ReadRoutesUseCase reads, GetRouteDirectionsUseCase directions, CustomerPortfolioReadUseCase customers,
                                      ReorderRoutePointsUseCase reorder) {
        return new RouteController(mock(CreateRouteUseCase.class), mock(CopyRouteUseCase.class), reorder,
                mock(PublishRouteUseCase.class), mock(ReassignRouteUseCase.class), mock(ListSuggestedCustomersUseCase.class), reads, directions, customers,
                new io.micrometer.core.instrument.simple.SimpleMeterRegistry());
    }
}
