package com.nahui.followupbussiness.routing.adapter.in.rest;

import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.UUID;

@RestController
final class RouteOptimizationController {
    private static final Logger LOG = LoggerFactory.getLogger(RouteOptimizationController.class);
    private final OptimizeRouteUseCase s;

    RouteOptimizationController(OptimizeRouteUseCase x) {
        s = x;
    }

    @PostMapping("/routes/optimize")
    ResponseEntity<?> optimize(@RequestBody OptimizeRouteUseCase.Command r, @AuthenticationPrincipal AuthenticatedActor a, @RequestHeader(value = "X-Correlation-Id", required = false) String c) {
        String id = correlationId(c);
        try {
            return ResponseEntity.ok().header("X-Correlation-Id", id).body(s.optimize(r, a));
        } catch (OptimizeRouteUseCase.Forbidden e) {
            LOG.warn("operation=ROUTE_OPTIMIZATION result=FORBIDDEN reason={} correlationId={}", safeForbiddenReason(e.getMessage()), id);
            return ResponseEntity.status(403).build();
        } catch (OptimizeRouteUseCase.Conflict e) {
            return ResponseEntity.status(409).build();
        } catch (OptimizeRouteUseCase.Invalid e) {
            return invalid(e, id);
        } catch (OptimizeRouteUseCase.RateLimited e) {
            return unavailable("PROVIDER_RATE_LIMITED", id);
        } catch (OptimizeRouteUseCase.Unavailable e) {
            return unavailable(safeUnavailableReason(e.getMessage()), id);
        }
    }

    private ResponseEntity<ProblemDetail> unavailable(String code, String id) {
        LOG.warn("operation=ROUTE_OPTIMIZATION result=UNAVAILABLE reason={} correlationId={}", code, id);
        var p = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, code);
        p.setProperty("code", code);
        p.setProperty("correlationId", id);
        return ResponseEntity.status(503).header("Retry-After", "1").header("X-Correlation-Id", id).contentType(MediaType.APPLICATION_PROBLEM_JSON).body(p);
    }

    private ResponseEntity<ProblemDetail> invalid(OptimizeRouteUseCase.Invalid exception, String id) {
        String code = publicValidationCode(exception.getMessage());
        LOG.warn("operation=ROUTE_OPTIMIZATION result=VALIDATION_FAILED code={} correlationId={}", code, id);
        var p = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_CONTENT, "Request cannot be processed");
        p.setProperty("code", code);
        p.setProperty("correlationId", id);
        return ResponseEntity.unprocessableContent().header("X-Correlation-Id", id).contentType(MediaType.APPLICATION_PROBLEM_JSON).body(p);
    }

    private static String publicValidationCode(String code) {
        return switch (code) {
            case "OPTIMIZE_REQUEST_REQUIRED", "ROUTE_ID_REQUIRED", "ROUTE_VERSION_REQUIRED", "VISITS_REQUIRED", "VISIT_LIMIT_EXCEEDED", "AVAILABILITY_END_MUST_BE_AFTER_START", "VISIT_REQUIRED", "VISIT_CUSTOMER_REQUIRED", "DUPLICATE_VISIT_CUSTOMER", "VISIT_DURATION_REQUIRED", "VISIT_PRIORITY_REQUIRED", "VISIT_WINDOWS_REQUIRED", "VISIT_WINDOW_END_MUST_BE_AFTER_START", "VISIT_TERRITORY_REQUIRED", "VISIT_TERRITORY_INACTIVE", "VISIT_TERRITORY_NOT_ASSIGNED_TO_SELLER", "ROUTE_ENDPOINT_LOCATION_REQUIRED", "MULTIPLE_VISIT_TERRITORIES_NOT_SUPPORTED" -> code;
            default -> "INVALID_OPTIMIZE_REQUEST";
        };
    }

    private static String safeForbiddenReason(String reason) {
        return switch (reason) {
            case "ACTOR_NOT_AUTHORIZED_FOR_OPTIMIZATION", "ROUTE_NOT_FOUND_IN_TENANT", "ROUTE_OUTSIDE_ACTOR_PORTFOLIO", "VISIT_OUTSIDE_ACTIVE_SELLER_PORTFOLIO", "VISIT_LOCATION_UNAVAILABLE" -> reason;
            default -> "OPTIMIZE_FORBIDDEN";
        };
    }

    private static String safeUnavailableReason(String reason) {
        return switch (reason) {
            case "PROVIDER_UNCONFIGURED", "PROVIDER_UNAUTHORIZED", "PROVIDER_RATE_LIMITED", "PROVIDER_TIMEOUT", "PROVIDER_UNAVAILABLE" -> reason;
            default -> "PROVIDER_UNAVAILABLE";
        };
    }

    private static String correlationId(String value) {
        if (value == null || value.length() != 36) return UUID.randomUUID().toString();
        try {
            UUID id = UUID.fromString(value);
            if (id.version() != 4) return UUID.randomUUID().toString();
            String canonical = id.toString();
            return canonical.equals(value.toLowerCase(Locale.ROOT)) ? canonical : UUID.randomUUID().toString();
        } catch (IllegalArgumentException ignored) {
            return UUID.randomUUID().toString();
        }
    }
}
