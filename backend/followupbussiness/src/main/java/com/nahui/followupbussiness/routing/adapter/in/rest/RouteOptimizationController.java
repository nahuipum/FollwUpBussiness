package com.nahui.followupbussiness.routing.adapter.in.rest;

import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
final class RouteOptimizationController {
    private final OptimizeRouteUseCase s;

    RouteOptimizationController(OptimizeRouteUseCase x) {
        s = x;
    }

    @PostMapping("/routes/optimize")
    ResponseEntity<?> optimize(@RequestBody OptimizeRouteUseCase.Command r, @AuthenticationPrincipal AuthenticatedActor a, @RequestHeader(value = "X-Correlation-Id", required = false) String c) {
        String id = c == null ? java.util.UUID.randomUUID().toString() : c;
        try {
            return ResponseEntity.ok().header("X-Correlation-Id", id).body(s.optimize(r, a));
        } catch (OptimizeRouteUseCase.Forbidden e) {
            return ResponseEntity.status(403).build();
        } catch (OptimizeRouteUseCase.Conflict e) {
            return ResponseEntity.status(409).build();
        } catch (OptimizeRouteUseCase.Invalid e) {
            return ResponseEntity.unprocessableContent().build();
        } catch (OptimizeRouteUseCase.RateLimited e) {
            return unavailable("PROVIDER_RATE_LIMITED", id);
        } catch (OptimizeRouteUseCase.Unavailable e) {
            return unavailable("PROVIDER_UNCONFIGURED", id);
        }
    }

    private ResponseEntity<ProblemDetail> unavailable(String code, String id) {
        var p = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, code);
        p.setProperty("code", code);
        p.setProperty("correlationId", id);
        return ResponseEntity.status(503).header("Retry-After", "1").header("X-Correlation-Id", id).contentType(MediaType.APPLICATION_PROBLEM_JSON).body(p);
    }
}
