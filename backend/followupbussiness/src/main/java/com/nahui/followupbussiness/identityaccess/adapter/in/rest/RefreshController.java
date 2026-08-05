package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.RefreshService;
import com.nahui.followupbussiness.identityaccess.application.port.in.RefreshSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.WebOriginPolicy;
import com.nahui.followupbussiness.identityaccess.application.port.out.RefreshRateLimitPort;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.net.URI;
import java.util.*;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@ConditionalOnBean(RefreshSessionUseCase.class)
public class RefreshController {
    private final RefreshSessionUseCase service;
    private final WebOriginPolicy origins;
    private final RefreshRateLimiter limiter;

    public RefreshController(RefreshSessionUseCase service, WebOriginPolicy origins, RefreshRateLimiter limiter) {
        this.service = service;
        this.origins = origins;
        this.limiter = limiter;
    }

    @PostMapping("/refresh")
    ResponseEntity<?> refresh(@RequestHeader(value = "X-Auth-Client", required = false) String channel, @RequestHeader(value = "X-Client-Instance-Id", required = false) UUID client, @RequestHeader(value = "X-CSRF-Token", required = false) String csrf, @CookieValue(value = "__Host-fs-refresh", required = false) String cookie, @Valid @RequestBody(required = false) Body body, HttpServletRequest request, HttpServletResponse response) {
        UUID correlation = correlation(request);
        boolean browser = request.getHeader("Origin") != null || request.getHeader("Sec-Fetch-Site") != null;
        response.setHeader("X-Correlation-Id", correlation.toString());
        if (!"WEB".equals(channel) && !"MOBILE".equals(channel) || client == null)
            return problem(400, "AUTH_CLIENT_CHANNEL_INVALID", correlation);
        String token;
        if ("WEB".equals(channel)) {
            if (!origins.isAllowed(request.getHeader("Origin")) || body != null || cookie == null)
                return problem(400, "AUTH_CLIENT_CHANNEL_INVALID", correlation);
            token = cookie;
        } else {
            if (browser || cookie != null || body == null)
                return problem(400, "AUTH_CLIENT_CHANNEL_INVALID", correlation);
            token = body.refreshToken();
        }
        try {
            var early = limiter.checkPresented(token, request.getRemoteAddr());
            if (!early.allowed()) return problem(429, "AUTH_RATE_LIMITED", correlation, early.retryAfterSeconds());
            var r = service.refresh(new RefreshService.Command(token, csrf, channel, client, correlation, request.getRemoteAddr()));
            response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
            response.setHeader(HttpHeaders.PRAGMA, "no-cache");
            var credentials = Map.of("accessToken", r.accessToken(), "tokenType", "Bearer", "expiresIn", 600);
            if ("WEB".equals(channel)) {
                response.addHeader(HttpHeaders.SET_COOKIE, "__Host-fs-refresh=" + r.refreshToken() + "; Path=/; Secure; HttpOnly; SameSite=Strict");
                return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(Map.of("channel", "WEB", "credentials", credentials, "csrfToken", r.csrfToken(), "user", user(r)));
            }
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(Map.of("channel", "MOBILE", "credentials", credentials, "refreshToken", r.refreshToken(), "refreshExpiresIn", 2592000, "user", user(r)));
        } catch (RefreshRateLimitPort.UnavailableException e) {
            return problem(503, "AUTH_RATE_LIMIT_UNAVAILABLE", correlation, 60L);
        } catch (RefreshService.Rejected e) {
            int status = e.code == RefreshService.Code.CSRF ? 403 : e.code == RefreshService.Code.ALREADY_ROTATED ? 409 : e.code == RefreshService.Code.RATE_LIMITED ? 429 : 401;
            String code = switch (e.code) {
                case CSRF -> "CSRF_TOKEN_INVALID";
                case ALREADY_ROTATED -> "REFRESH_ALREADY_ROTATED";
                case EXPIRED -> "REFRESH_TOKEN_EXPIRED";
                case REUSED -> "REFRESH_TOKEN_REUSED";
                case RATE_LIMITED -> "AUTH_RATE_LIMITED";
                default -> "REFRESH_TOKEN_INVALID";
            };
            return problem(status, code, correlation, e.retryAfter == 0 ? null : e.retryAfter);
        }
    }

    private static Map<String, Object> user(RefreshService.Result r) {
        var a = r.account();
        var user = new LinkedHashMap<String, Object>();
        user.put("id", a.id());
        user.put("displayName", a.displayName());
        user.put("email", a.email());
        user.put("status", a.status());
        user.put("roles", List.of(a.role().code()));
        user.put("company", a.companyId());
        return user;
    }

    private static UUID correlation(HttpServletRequest r) {
        try {
            return UUID.fromString(r.getHeader("X-Correlation-Id"));
        } catch (Exception e) {
            return UUID.randomUUID();
        }
    }

    private static ResponseEntity<ProblemDetail> problem(int status, String code, UUID correlation) {
        return problem(status, code, correlation, null);
    }

    private static ResponseEntity<ProblemDetail> problem(int status, String code, UUID correlation, Long retry) {
        var p = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(status), status == 401 ? "Authentication failed" : "Request cannot be processed");
        p.setType(URI.create("urn:followupbussiness:auth:" + code.toLowerCase(Locale.ROOT)));
        p.setProperty("code", code);
        p.setProperty("correlationId", correlation.toString());
        var response = ResponseEntity.status(status).header(HttpHeaders.CACHE_CONTROL, "no-store").header(HttpHeaders.PRAGMA, "no-cache").header("X-Correlation-Id", correlation.toString());
        if (retry != null) response.header(HttpHeaders.RETRY_AFTER, Long.toString(retry));
        return response.body(p);
    }

    record Body(@NotBlank @Size(min = 43, max = 43) @Pattern(regexp = "^[A-Za-z0-9_-]{43}$") String refreshToken) {
    }
}
