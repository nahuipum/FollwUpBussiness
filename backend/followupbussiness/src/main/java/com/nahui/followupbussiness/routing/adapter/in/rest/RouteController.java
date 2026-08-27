package com.nahui.followupbussiness.routing.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.routing.application.port.in.CreateRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.CopyRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ReorderRoutePointsUseCase;
import com.nahui.followupbussiness.routing.application.port.in.PublishRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ReassignRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ListSuggestedCustomersUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ReadRoutesUseCase;
import com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase;
import com.nahui.followupbussiness.routing.application.port.out.RouteDirections;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.routing.domain.Route;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.http.HttpServletRequest;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public final class RouteController {
    private static final Logger LOG = LoggerFactory.getLogger(RouteController.class);
    private final CreateRouteUseCase create;
    private final CopyRouteUseCase copy;
    private final ReorderRoutePointsUseCase reorder;
    private final PublishRouteUseCase publish;
    private final ReassignRouteUseCase reassign;
    private final ListSuggestedCustomersUseCase suggestions;
    private final ReadRoutesUseCase reads;
    private final GetRouteDirectionsUseCase directions;
    private final CustomerPortfolioReadUseCase customers;
    private final MeterRegistry meters;

    public RouteController(CreateRouteUseCase create, CopyRouteUseCase copy, ReorderRoutePointsUseCase reorder, PublishRouteUseCase publish, ReassignRouteUseCase reassign, ListSuggestedCustomersUseCase suggestions, ReadRoutesUseCase reads, GetRouteDirectionsUseCase directions, CustomerPortfolioReadUseCase customers, MeterRegistry meters) {
        this.create = create;
        this.copy = copy;
        this.reorder = reorder;
        this.publish = publish;
        this.reassign = reassign;
        this.suggestions = suggestions;
        this.reads = reads;
        this.directions = directions;
        this.customers = customers;
        this.meters = meters;
    }

    @GetMapping("/routes")
    public ResponseEntity<?> list(@RequestParam(required = false) LocalDate date, @RequestParam(required = false) UUID sellerId,
                                  @RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int pageSize, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            var result = reads.list(new ReadRoutesUseCase.ListQuery(date, sellerId, status, page, pageSize), actor);
            long totalPages = result.total() == 0 ? 0 : (result.total() + pageSize - 1) / pageSize;
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(new RoutePage(views(result.items(), actor), new PageInfo(page, pageSize, result.total(), totalPages)));
        } catch (ReadRoutesUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (ReadRoutesUseCase.Invalid | IllegalArgumentException ex) { return problem(HttpStatus.BAD_REQUEST, correlation); }
    }

    @GetMapping("/routes/my-route")
    public ResponseEntity<?> myRoute(@RequestParam LocalDate date, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try { return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(view(reads.myRoute(date, actor), actor)); }
        catch (ReadRoutesUseCase.Conflict ex) { return problem(HttpStatus.CONFLICT, correlation); }
        catch (ReadRoutesUseCase.NotFound ex) { return problem(HttpStatus.NOT_FOUND, correlation); }
    }

    @GetMapping("/routes/{routeId}")
    public ResponseEntity<?> get(@PathVariable UUID routeId, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try { return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(view(reads.get(routeId, actor), actor)); }
        catch (ReadRoutesUseCase.NotFound ex) { return problem(HttpStatus.NOT_FOUND, correlation); }
        catch (ReadRoutesUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
    }

    @GetMapping("/routes/{routeId}/directions")
    public ResponseEntity<?> directions(@PathVariable UUID routeId, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            RouteDirections.Directions result = directions.get(routeId, actor);
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(new DirectionsResponse(result.geometry(), result.legs(), result.distanceMeters(), result.durationSeconds()));
        } catch (ReadRoutesUseCase.NotFound ex) { return problem(HttpStatus.NOT_FOUND, correlation); }
        catch (ReadRoutesUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (GetRouteDirectionsUseCase.Invalid ex) { return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation); }
        catch (GetRouteDirectionsUseCase.Unavailable ex) { return directionsUnavailable(correlation); }
    }

    @PostMapping("/routes/{routeId}/directions/preview")
    public ResponseEntity<?> previewDirections(@PathVariable UUID routeId, @RequestBody DirectionsPreviewRequest request,
                                                @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            GetRouteDirectionsUseCase.Preview preview = request == null ? null : new GetRouteDirectionsUseCase.Preview(routeId,
                    request.baseRouteVersion(), request.routePointIds());
            RouteDirections.Directions result = directions.preview(preview, actor);
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString())
                    .body(new DirectionsResponse(result.geometry(), result.legs(), result.distanceMeters(), result.durationSeconds()));
        } catch (ReadRoutesUseCase.NotFound ex) { return problem(HttpStatus.NOT_FOUND, correlation); }
        catch (ReadRoutesUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (GetRouteDirectionsUseCase.Conflict ex) { return problem(HttpStatus.CONFLICT, correlation); }
        catch (GetRouteDirectionsUseCase.Invalid | IllegalArgumentException ex) { return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation); }
        catch (GetRouteDirectionsUseCase.Unavailable ex) { return directionsUnavailable(correlation); }
    }

    @GetMapping("/routes/suggested-customers")
    public ResponseEntity<?> suggestedCustomers(@RequestParam UUID sellerId, @RequestParam LocalDate date,
                                                @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int pageSize,
                                                @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            var result = suggestions.list(new ListSuggestedCustomersUseCase.Query(sellerId, date, page, pageSize), actor);
            int totalPages = result.total() == 0 ? 0 : (int) ((result.total() + pageSize - 1) / pageSize);
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(new SuggestedPage(result.items().stream().map(Suggested::from).toList(), new PageInfo(page, pageSize, result.total(), totalPages)));
        } catch (ListSuggestedCustomersUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (ListSuggestedCustomersUseCase.Invalid | IllegalArgumentException ex) { return problem(HttpStatus.BAD_REQUEST, correlation); }
    }

    @PostMapping("/routes/{routeId}/reassign")
    public ResponseEntity<?> reassign(@PathVariable UUID routeId, @RequestHeader("If-Match") String ifMatch,
                                      @RequestHeader("Idempotency-Key") UUID key, @RequestBody ReassignRequest request,
                                      @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            Route route = reassign.reassign(new ReassignRouteUseCase.Command(routeId, request.sellerId(), request.reason(), parseVersion(ifMatch), key, correlation), actor);
            meters.counter("routes.reassigned").increment();
            return ResponseEntity.ok().eTag("\"" + route.version() + "\"").header("X-Correlation-Id", correlation.toString()).body(view(route, actor));
        } catch (ReassignRouteUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (ReassignRouteUseCase.Conflict ex) { return problem(HttpStatus.CONFLICT, correlation); }
        catch (ReassignRouteUseCase.Unavailable ex) { return problem(HttpStatus.SERVICE_UNAVAILABLE, correlation); }
        catch (ReassignRouteUseCase.Invalid | IllegalArgumentException ex) { return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation); }
    }

    @PostMapping("/routes/{routeId}/copy")
    public ResponseEntity<?> copy(@PathVariable UUID routeId, @RequestHeader("Idempotency-Key") UUID key,
                                  @RequestBody CopyRequest request, @AuthenticationPrincipal AuthenticatedActor actor,
                                  HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            var result = copy.copy(new CopyRouteUseCase.Command(routeId, request.date(), request.sellerId(), request.name(), key), actor);
            meters.counter("routes.copied").increment();
            return ResponseEntity.created(URI.create("/routes/" + result.route().id())).header("X-Correlation-Id", correlation.toString())
                    .body(new CopyResponse(view(result.route(), actor), result.warnings().stream().map(w -> new CopyWarning(w.code(), w.resourceType(), w.sourcePointId())).toList()));
        } catch (CopyRouteUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (CopyRouteUseCase.Conflict ex) { return problem(HttpStatus.CONFLICT, correlation); }
        catch (CopyRouteUseCase.Invalid | IllegalArgumentException ex) { return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation); }
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
            return ResponseEntity.ok().eTag("\"" + route.version() + "\"").header("X-Correlation-Id", correlation.toString()).body(view(route, actor));
        } catch (PublishRouteUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (PublishRouteUseCase.Conflict ex) { return problem(HttpStatus.CONFLICT, correlation); }
        catch (PublishRouteUseCase.Unavailable ex) { return problem(HttpStatus.SERVICE_UNAVAILABLE, correlation); }
        catch (PublishRouteUseCase.Invalid | IllegalArgumentException ex) { return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation); }
    }

    @PutMapping("/routes/{routeId}/points/order")
    public ResponseEntity<?> reorder(@PathVariable UUID routeId, @RequestHeader("If-Match") String ifMatch, @RequestBody ReorderRequest request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation=correlationId(http);
        final long version;
        try {
            version = parseVersion(ifMatch);
        } catch (IllegalArgumentException exception) {
            return reorderProblem("INVALID_ROUTE_VERSION", correlation);
        }
        try {
            if (request == null) return reorderProblem("INVALID_REORDER_REQUEST", correlation);
            Route route=reorder.reorder(new ReorderRoutePointsUseCase.Command(routeId,version,request.routePointIds(),correlation),actor);
            meters.counter("routes.reordered").increment();
            return ResponseEntity.ok().eTag("\""+route.version()+"\"").header("X-Correlation-Id",correlation.toString()).body(view(route, actor));
        } catch (ReorderRoutePointsUseCase.Forbidden e) { return problem(HttpStatus.FORBIDDEN,correlation); }
        catch (ReorderRoutePointsUseCase.Conflict e) { return problem(HttpStatus.CONFLICT,correlation); }
        catch (ReorderRoutePointsUseCase.Invalid e) { return reorderProblem(e.getMessage(), correlation); }
    }

    private static long parseVersion(String raw) { try { String value=raw==null?"":raw.replace("\"",""); long version=Long.parseLong(value); if(version<1) throw new NumberFormatException(); return version; } catch(Exception e) { throw new IllegalArgumentException("invalid If-Match"); } }

    @PostMapping("/routes")
    public ResponseEntity<?> create(@RequestHeader("Idempotency-Key") UUID key, @RequestBody Request request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            Route route = create.create(new CreateRouteUseCase.Command(request.name(), request.date(), request.sellerId(), request.startLocation(), request.customerIds(), key), actor);
            meters.counter("routes.created").increment();
            return ResponseEntity.created(URI.create("/routes/" + route.id())).header("X-Correlation-Id", correlation.toString()).body(view(route, actor));
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
    private static ResponseEntity<?> reorderProblem(String code, UUID correlation) {
        String safeCode = code == null || code.isBlank() ? "INVALID_REORDER_REQUEST" : code;
        LOG.warn("Route reorder rejected: code={}, correlationId={}", safeCode, correlation);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_CONTENT, "Request cannot be processed");
        detail.setProperty("code", safeCode);
        detail.setProperty("correlationId", correlation.toString());
        return ResponseEntity.unprocessableContent().header("X-Correlation-Id", correlation.toString()).body(detail);
    }
    private static ResponseEntity<?> directionsUnavailable(UUID correlation) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, "Road details are temporarily unavailable");
        detail.setProperty("code", "DIRECTIONS_UNAVAILABLE");
        detail.setProperty("correlationId", correlation.toString());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).header("X-Correlation-Id", correlation.toString()).body(detail);
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

    private List<View> views(List<Route> routes, AuthenticatedActor actor) {
        Map<UUID, String> names = customerNames(routes, actor);
        return routes.stream().map(route -> View.from(route, names)).toList();
    }

    private View view(Route route, AuthenticatedActor actor) {
        return View.from(route, customerNames(List.of(route), actor));
    }

    private Map<UUID, String> customerNames(List<Route> routes, AuthenticatedActor actor) {
        List<UUID> customerIds = routes.stream().flatMap(route -> route.points().stream()).map(Route.Point::customerId).distinct().toList();
        return customers.routeCustomerNames(actor.tenantId(), customerIds).stream()
                .collect(java.util.stream.Collectors.toMap(CustomerPortfolioReadUseCase.RouteCustomerName::id, CustomerPortfolioReadUseCase.RouteCustomerName::name));
    }

    public record Request(String name, LocalDate date, UUID sellerId, GeoPoint startLocation, List<UUID> customerIds) {
    }
    public record ReorderRequest(List<UUID> routePointIds) { }
    public record DirectionsPreviewRequest(long baseRouteVersion, List<UUID> routePointIds) { }
    public record PublishRequest(Boolean notifySeller) { }
    public record ReassignRequest(UUID sellerId, String reason) { }
    public record CopyRequest(LocalDate date, UUID sellerId, String name) { }
    record CopyResponse(View route, List<CopyWarning> warnings) { }
    record CopyWarning(String code, String resourceType, UUID sourcePointId) { }
    record SuggestedPage(List<Suggested> items, PageInfo page) { }
    record RoutePage(List<View> items, PageInfo page) { }
    record PageInfo(int page, int pageSize, long totalElements, long totalPages) { }
    record DirectionsResponse(List<GeoPoint> geometry, List<RouteDirections.Leg> legs, long distanceMeters, long durationSeconds) { }
    record Suggested(CustomerResponse customer, int priority, String reason, java.time.Instant lastVisitAt) {
        static Suggested from(ListSuggestedCustomersUseCase.Item item) { return new Suggested(CustomerResponse.from(item.customer()), item.priority(), item.reason(), item.lastVisitAt()); }
    }
    record CustomerResponse(UUID id, String name, String documentType, String documentNumber, String phone, String email, String segment, String address, GeoPoint location, Integer visitFrequencyDays, UUID territoryId, List<UUID> assignedSellerIds, String status, java.time.Instant createdAt, java.time.Instant updatedAt, long version) {
        static CustomerResponse from(Customer c) { return new CustomerResponse(c.id(), c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.segment(), c.address(), c.location(), c.visitFrequencyDays(), c.territoryId(), List.of(), c.status(), c.createdAt(), c.updatedAt(), c.version()); }
    }

    record View(UUID id, String name, LocalDate date, UUID sellerId, GeoPoint startLocation, String status,
                List<Point> points, java.time.Instant createdAt, java.time.Instant updatedAt, long version) {
        static View from(Route r, Map<UUID, String> customerNames) {
            return new View(r.id(), r.name(), r.date(), r.sellerId(), r.startLocation(), r.status(), r.points().stream().map(p -> new Point(p.id(), p.customerId(), customerNames.get(p.customerId()), p.sequence(), "PENDING", p.location())).toList(), r.createdAt(), r.updatedAt(), r.version());
        }
    }

    record Point(UUID id, UUID customerId, String customerName, int sequence, String status,
                 com.nahui.followupbussiness.customers.domain.GeoPoint location) {
    }
}
