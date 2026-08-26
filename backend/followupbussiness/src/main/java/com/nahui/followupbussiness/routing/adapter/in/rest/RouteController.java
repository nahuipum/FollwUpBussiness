package com.nahui.followupbussiness.routing.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.routing.application.port.in.CreateRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ReorderRoutePointsUseCase;
import com.nahui.followupbussiness.routing.application.port.in.PublishRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ReassignRouteUseCase;
import com.nahui.followupbussiness.routing.domain.Route;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.http.HttpServletRequest;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public final class RouteController {
    private final CreateRouteUseCase create;
    private final ReorderRoutePointsUseCase reorder;
    private final PublishRouteUseCase publish;
    private final ReassignRouteUseCase reassign;
    private final MeterRegistry meters;

    public RouteController(CreateRouteUseCase create, ReorderRoutePointsUseCase reorder, PublishRouteUseCase publish, ReassignRouteUseCase reassign, MeterRegistry meters) {
        this.create = create;
        this.reorder = reorder;
        this.publish = publish;
        this.reassign = reassign;
        this.meters = meters;
    }

    @PostMapping("/routes/{routeId}/reassign")
    public ResponseEntity<?> reassign(@PathVariable UUID routeId, @RequestHeader("If-Match") String ifMatch,
                                      @RequestHeader("Idempotency-Key") UUID key, @RequestBody ReassignRequest request,
                                      @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            Route route = reassign.reassign(new ReassignRouteUseCase.Command(routeId, request.sellerId(), request.reason(), parseVersion(ifMatch), key, correlation), actor);
            meters.counter("routes.reassigned").increment();
            return ResponseEntity.ok().eTag("\"" + route.version() + "\"").header("X-Correlation-Id", correlation.toString()).body(View.from(route));
        } catch (ReassignRouteUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (ReassignRouteUseCase.Conflict ex) { return problem(HttpStatus.CONFLICT, correlation); }
        catch (ReassignRouteUseCase.Unavailable ex) { return problem(HttpStatus.SERVICE_UNAVAILABLE, correlation); }
        catch (ReassignRouteUseCase.Invalid | IllegalArgumentException ex) { return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation); }
    }

    @PostMapping("/routes/{routeId}/publish")
    public ResponseEntity<?> publish(@PathVariable UUID routeId, @RequestHeader("If-Match") String ifMatch,
                                     @RequestHeader("Idempotency-Key") UUID key, @RequestBody(required = false) PublishRequest request,
                                     @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            boolean notifySeller = request == null || request.notifySeller() == null || request.notifySeller();
            Route route = publish.publish(new PublishRouteUseCase.Command(routeId, parseVersion(ifMatch), key, notifySeller, correlation), actor);
            meters.counter("routes.published").increment();
            return ResponseEntity.ok().eTag("\"" + route.version() + "\"").header("X-Correlation-Id", correlation.toString()).body(View.from(route));
        } catch (PublishRouteUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (PublishRouteUseCase.Conflict ex) { return problem(HttpStatus.CONFLICT, correlation); }
        catch (PublishRouteUseCase.Unavailable ex) { return problem(HttpStatus.SERVICE_UNAVAILABLE, correlation); }
        catch (PublishRouteUseCase.Invalid | IllegalArgumentException ex) { return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation); }
    }

    @PutMapping("/routes/{routeId}/points/order")
    public ResponseEntity<?> reorder(@PathVariable UUID routeId, @RequestHeader("If-Match") String ifMatch, @RequestBody ReorderRequest request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation=correlationId(http);
        try {
            long version=parseVersion(ifMatch);
            Route route=reorder.reorder(new ReorderRoutePointsUseCase.Command(routeId,version,request.routePointIds()),actor);
            meters.counter("routes.reordered").increment();
            return ResponseEntity.ok().eTag("\""+route.version()+"\"").header("X-Correlation-Id",correlation.toString()).body(View.from(route));
        } catch (ReorderRoutePointsUseCase.Forbidden e) { return problem(HttpStatus.FORBIDDEN,correlation); }
        catch (ReorderRoutePointsUseCase.Conflict e) { return problem(HttpStatus.CONFLICT,correlation); }
        catch (ReorderRoutePointsUseCase.Invalid | IllegalArgumentException e) { return problem(HttpStatus.UNPROCESSABLE_CONTENT,correlation); }
    }

    private static long parseVersion(String raw) { try { String value=raw==null?"":raw.replace("\"",""); long version=Long.parseLong(value); if(version<1) throw new NumberFormatException(); return version; } catch(Exception e) { throw new IllegalArgumentException("invalid If-Match"); } }

    @PostMapping("/routes")
    public ResponseEntity<?> create(@RequestHeader("Idempotency-Key") UUID key, @RequestBody Request request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            Route route = create.create(new CreateRouteUseCase.Command(request.name(), request.date(), request.sellerId(), request.startLocation(), request.customerIds(), key), actor);
            meters.counter("routes.created").increment();
            return ResponseEntity.created(URI.create("/routes/" + route.id())).header("X-Correlation-Id", correlation.toString()).body(View.from(route));
        } catch (CreateRouteUseCase.Forbidden ex) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (CreateRouteUseCase.Conflict ex) {
            return problem(HttpStatus.CONFLICT, correlation);
        } catch (CreateRouteUseCase.Invalid | IllegalArgumentException ex) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        }
    }

    private static ResponseEntity<?> problem(HttpStatus status, UUID correlation) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(status, "Request cannot be processed");
        detail.setProperty("correlationId", correlation.toString());
        return ResponseEntity.status(status).header("X-Correlation-Id", correlation.toString()).body(detail);
    }

    private static UUID correlationId(HttpServletRequest request) {
        Object value = request.getAttribute("com.nahui.followupbussiness.request.correlationId");
        if (value instanceof UUID id) return id;
        try {
            UUID id = UUID.fromString(request.getHeader("X-Correlation-Id"));
            request.setAttribute("com.nahui.followupbussiness.request.correlationId", id);
            return id;
        } catch (Exception ignored) {
            UUID id = UUID.randomUUID();
            request.setAttribute("com.nahui.followupbussiness.request.correlationId", id);
            return id;
        }
    }

    public record Request(String name, LocalDate date, UUID sellerId, GeoPoint startLocation, List<UUID> customerIds) {
    }
    public record ReorderRequest(List<UUID> routePointIds) { }
    public record PublishRequest(Boolean notifySeller) { }
    public record ReassignRequest(UUID sellerId, String reason) { }

    record View(UUID id, String name, LocalDate date, UUID sellerId, GeoPoint startLocation, String status,
                List<Point> points, java.time.Instant createdAt, java.time.Instant updatedAt, long version) {
        static View from(Route r) {
            return new View(r.id(), r.name(), r.date(), r.sellerId(), r.startLocation(), r.status(), r.points().stream().map(p -> new Point(p.id(), p.customerId(), p.sequence(), "PENDING", p.location())).toList(), r.createdAt(), r.updatedAt(), r.version());
        }
    }

    record Point(UUID id, UUID customerId, int sequence, String status,
                 com.nahui.followupbussiness.customers.domain.GeoPoint location) {
    }
}
