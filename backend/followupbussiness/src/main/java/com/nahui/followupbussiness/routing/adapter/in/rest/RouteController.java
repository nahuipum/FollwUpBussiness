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
import com.nahui.followupbussiness.customers.domain.Customer;
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
    private final CopyRouteUseCase copy;
    private final ReorderRoutePointsUseCase reorder;
    private final PublishRouteUseCase publish;
    private final ReassignRouteUseCase reassign;
    private final ListSuggestedCustomersUseCase suggestions;
    private final ReadRoutesUseCase reads;
    private final MeterRegistry meters;

    public RouteController(CreateRouteUseCase create, CopyRouteUseCase copy, ReorderRoutePointsUseCase reorder, PublishRouteUseCase publish, ReassignRouteUseCase reassign, ListSuggestedCustomersUseCase suggestions, ReadRoutesUseCase reads, MeterRegistry meters) {
        this.create = create;
        this.copy = copy;
        this.reorder = reorder;
        this.publish = publish;
        this.reassign = reassign;
        this.suggestions = suggestions;
        this.reads = reads;
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
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(new RoutePage(result.items().stream().map(View::from).toList(), new PageInfo(page, pageSize, result.total(), totalPages)));
        } catch (ReadRoutesUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (ReadRoutesUseCase.Invalid | IllegalArgumentException ex) { return problem(HttpStatus.BAD_REQUEST, correlation); }
    }

    @GetMapping("/routes/my-route")
    public ResponseEntity<?> myRoute(@RequestParam LocalDate date, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try { return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(View.from(reads.myRoute(date, actor))); }
        catch (ReadRoutesUseCase.Conflict ex) { return problem(HttpStatus.CONFLICT, correlation); }
        catch (ReadRoutesUseCase.NotFound ex) { return problem(HttpStatus.NOT_FOUND, correlation); }
    }

    @GetMapping("/routes/{routeId}")
    public ResponseEntity<?> get(@PathVariable UUID routeId, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try { return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(View.from(reads.get(routeId, actor))); }
        catch (ReadRoutesUseCase.NotFound ex) { return problem(HttpStatus.NOT_FOUND, correlation); }
        catch (ReadRoutesUseCase.Forbidden ex) { return problem(HttpStatus.FORBIDDEN, correlation); }
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
            return ResponseEntity.ok().eTag("\"" + route.version() + "\"").header("X-Correlation-Id", correlation.toString()).body(View.from(route));
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
                    .body(new CopyResponse(View.from(result.route()), result.warnings().stream().map(w -> new CopyWarning(w.code(), w.resourceType(), w.sourcePointId())).toList()));
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
            Route route=reorder.reorder(new ReorderRoutePointsUseCase.Command(routeId,version,request.routePointIds(),correlation),actor);
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
    public record CopyRequest(LocalDate date, UUID sellerId, String name) { }
    record CopyResponse(View route, List<CopyWarning> warnings) { }
    record CopyWarning(String code, String resourceType, UUID sourcePointId) { }
    record SuggestedPage(List<Suggested> items, PageInfo page) { }
    record RoutePage(List<View> items, PageInfo page) { }
    record PageInfo(int page, int pageSize, long totalElements, long totalPages) { }
    record Suggested(CustomerResponse customer, int priority, String reason, java.time.Instant lastVisitAt) {
        static Suggested from(ListSuggestedCustomersUseCase.Item item) { return new Suggested(CustomerResponse.from(item.customer()), item.priority(), item.reason(), item.lastVisitAt()); }
    }
    record CustomerResponse(UUID id, String name, String documentType, String documentNumber, String phone, String email, String segment, String address, GeoPoint location, Integer visitFrequencyDays, UUID territoryId, List<UUID> assignedSellerIds, String status, java.time.Instant createdAt, java.time.Instant updatedAt, long version) {
        static CustomerResponse from(Customer c) { return new CustomerResponse(c.id(), c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.segment(), c.address(), c.location(), c.visitFrequencyDays(), c.territoryId(), List.of(), c.status(), c.createdAt(), c.updatedAt(), c.version()); }
    }

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
