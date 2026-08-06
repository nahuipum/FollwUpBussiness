package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryService;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@ConditionalOnBean(PasswordRecoveryService.class)
@RequestMapping("/auth")
public final class PasswordRecoveryController {
    private final PasswordRecoveryService service;
    private final PasswordRecoveryRateLimiter limiter;
    private final MeterRegistry metrics;

    public PasswordRecoveryController(PasswordRecoveryService service, PasswordRecoveryRateLimiter limiter, MeterRegistry metrics) {
        this.service = service;
        this.limiter = limiter;
        this.metrics = metrics;
    }

    @PostMapping("/password-recovery-requests")
    ResponseEntity<?> request(@Valid @RequestBody Request body, HttpServletRequest request, HttpServletResponse response) {
        String correlation = correlation(request);
        response.setHeader("X-Correlation-Id", correlation);
        try {
            var limit = limiter.request(body.email().strip().toLowerCase(Locale.ROOT), request.getRemoteAddr());
            if (!limit.allowed()) return problem(429, "AUTH_RATE_LIMITED", correlation, limit.retryAfter());
            // Only encrypted generic intake runs here; lookup, token generation and delivery are worker work.
            service.accept(body.email().strip().toLowerCase(Locale.ROOT));
            metrics.counter("followupbussiness.authentication.password_recovery", "result", "accepted").increment();
            return ResponseEntity.accepted().header("Cache-Control", "no-store").header("Pragma", "no-cache").header("X-Correlation-Id", correlation).body(Map.of("accepted", true));
        } catch (PasswordRecoveryRateLimiter.Unavailable e) {
            return problem(503, "AUTH_RATE_LIMIT_UNAVAILABLE", correlation, 60L);
        }
    }

    @PostMapping("/password-resets")
    ResponseEntity<?> reset(@Valid @RequestBody Reset body, HttpServletRequest request, HttpServletResponse response) {
        String correlation = correlation(request);
        response.setHeader("X-Correlation-Id", correlation);
        try {
            var limit = limiter.consume(body.token(), request.getRemoteAddr());
            if (!limit.allowed()) return problem(429, "AUTH_RATE_LIMITED", correlation, limit.retryAfter());
            service.reset(body.token(), body.newPassword().toCharArray());
            metrics.counter("followupbussiness.authentication.password_reset", "result", "success").increment();
            return ResponseEntity.noContent().header("Cache-Control", "no-store").header("Pragma", "no-cache").header("X-Correlation-Id", correlation).build();
        } catch (PasswordRecoveryRateLimiter.Unavailable e) {
            return problem(503, "AUTH_RATE_LIMIT_UNAVAILABLE", correlation, 60L);
        } catch (PasswordRecoveryService.Rejected e) {
            return switch (e.code) {
                case INVALID -> problem(400, "PASSWORD_RESET_TOKEN_INVALID", correlation, null);
                case EXPIRED -> problem(410, "PASSWORD_RESET_TOKEN_EXPIRED", correlation, null);
                case POLICY -> problem(422, "PASSWORD_POLICY_VIOLATION", correlation, null);
            };
        }
    }

    private static ResponseEntity<ProblemDetail> problem(int status, String code, String correlation, Long retry) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(org.springframework.http.HttpStatusCode.valueOf(status), "Request cannot be processed");
        p.setType(URI.create("urn:followupbussiness:auth:" + code.toLowerCase(Locale.ROOT)));
        p.setProperty("code", code);
        p.setProperty("correlationId", correlation);
        var r = ResponseEntity.status(status).header("Cache-Control", "no-store").header("Pragma", "no-cache").header("X-Correlation-Id", correlation);
        if (retry != null) r.header("Retry-After", Long.toString(retry));
        return r.body(p);
    }

    private static String correlation(HttpServletRequest r) {
        try {
            String v = r.getHeader("X-Correlation-Id");
            return v == null ? UUID.randomUUID().toString() : UUID.fromString(v).toString();
        } catch (IllegalArgumentException e) {
            return UUID.randomUUID().toString();
        }
    }

    record Request(@NotBlank @Email @Size(max = 254) String email) {
    }

    record Reset(@NotBlank @Size(min = 43, max = 43) String token, @NotBlank @Size(max = 72) String newPassword) {
    }
}
