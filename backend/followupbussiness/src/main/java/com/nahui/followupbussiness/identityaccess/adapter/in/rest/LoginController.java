package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.LoginService;
import com.nahui.followupbussiness.identityaccess.application.port.in.WebOriginPolicy;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@ConditionalOnBean(LoginService.class)
@RequestMapping("/auth")
public class LoginController {
    private static final Logger LOG = LoggerFactory.getLogger(LoginController.class);
    private final LoginService service;
    private final WebOriginPolicy origins;
    private final MeterRegistry metrics;
    private final LoginRateLimiter limiter;

    public LoginController(LoginService service, WebOriginPolicy origins, MeterRegistry metrics, LoginRateLimiter limiter) {
        this.service = service;
        this.origins = origins;
        this.metrics = metrics;
        this.limiter = limiter;
    }

    @PostMapping("/login")
    ResponseEntity<?> login(@RequestHeader(value = "X-Auth-Client", required = false) String channel, @RequestHeader(value = "X-Client-Instance-Id", required = false) UUID client, @Valid @RequestBody(required = false) Request request, HttpServletRequest servlet, HttpServletResponse response) {
        String correlation = correlation(servlet);
        response.setHeader("X-Correlation-Id", correlation);
        boolean browser = servlet.getHeader("Origin") != null || servlet.getHeader("Sec-Fetch-Site") != null;
        if (!("WEB".equals(channel) || "MOBILE".equals(channel)) || ("WEB".equals(channel) && !origins.isAllowed(servlet.getHeader("Origin"))) || ("MOBILE".equals(channel) && browser))
            return problem(400, "AUTH_CLIENT_CHANNEL_INVALID", correlation);
        if (client == null || request == null || request.identifier() == null || request.password() == null || request.identifier().length() < 3 || request.password().length() < 8)
            return problem(400, "VALIDATION_FAILED", correlation);
        try {
            var decision = limiter.check(request.identifier().strip().toLowerCase(Locale.ROOT), servlet.getRemoteAddr());
            if (!decision.allowed()) {
                metrics.counter("followupbussiness.authentication.login", "result", "rate_limited").increment();
                return problem(429, "AUTH_RATE_LIMITED", correlation, decision.retryAfterSeconds());
            }
        } catch (LoginRateLimiter.UnavailableException e) {
            metrics.counter("followupbussiness.authentication.login", "result", "rate_limit_unavailable").increment();
            return problem(503, "AUTH_RATE_LIMIT_UNAVAILABLE", correlation, 60L);
        }
        try {
            var result = service.login(request.identifier().strip().toLowerCase(Locale.ROOT), request.password().toCharArray(), channel, client);
            metrics.counter("followupbussiness.authentication.login", "result", "success", "channel", channel).increment();
            LOG.info("operation=AUTH_LOGIN result=SUCCESS correlationId={} channel={}", correlation, channel);
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Pragma", "no-cache");
            Map<String, Object> c = Map.of("accessToken", result.accessToken(), "tokenType", "Bearer", "expiresIn", 600);
            if ("WEB".equals(channel)) {
                response.addHeader("Set-Cookie", "__Host-fs-refresh=" + result.refreshToken() + "; Path=/; Secure; HttpOnly; SameSite=Strict");
                return ResponseEntity.ok().header("X-Correlation-Id", correlation).body(Map.of("channel", "WEB", "credentials", c, "csrfToken", result.csrfToken(), "user", user(result)));
            }
            return ResponseEntity.ok().header("X-Correlation-Id", correlation).body(Map.of("channel", "MOBILE", "credentials", c, "refreshToken", result.refreshToken(), "sessionRevocationTicket", result.revocationTicket(), "refreshExpiresIn", 2592000, "user", user(result)));
        } catch (LoginService.LoginFailedException e) {
            metrics.counter("followupbussiness.authentication.login", "result", "failed", "channel", channel).increment();
            LOG.info("operation=AUTH_LOGIN result=FAILED correlationId={} channel={}", correlation, channel);
            return problem(401, "AUTHENTICATION_FAILED", correlation);
        }
    }

    private ResponseEntity<ProblemDetail> problem(int status, String code, String correlation) {
        return problem(status, code, correlation, null);
    }

    private ResponseEntity<ProblemDetail> problem(int status, String code, String correlation, Long retryAfter) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(org.springframework.http.HttpStatusCode.valueOf(status), status == 401 ? "Authentication failed" : "Request cannot be processed");
        p.setType(URI.create("urn:followupbussiness:auth:" + code.toLowerCase(Locale.ROOT)));
        p.setProperty("code", code);
        p.setProperty("correlationId", correlation);
        var response = ResponseEntity.status(status).header("Cache-Control", "no-store").header("Pragma", "no-cache").header("X-Correlation-Id", correlation);
        if (retryAfter != null) response.header("Retry-After", Long.toString(retryAfter));
        return response.body(p);
    }

    private static String correlation(HttpServletRequest r) {
        String v = r.getHeader("X-Correlation-Id");
        try {
            return v == null ? UUID.randomUUID().toString() : UUID.fromString(v).toString();
        } catch (IllegalArgumentException e) {
            return UUID.randomUUID().toString();
        }
    }

    private static Map<String, Object> user(LoginService.Result r) {
        var a = r.account();
        var u = new LinkedHashMap<String, Object>();
        u.put("id", a.id());
        u.put("displayName", a.displayName());
        u.put("email", a.email());
        u.put("status", a.status());
        u.put("roles", List.of(a.role().code()));
        u.put("company", a.companyId());
        return u;
    }

    record Request(@NotBlank @Size(max = 254) String identifier, @NotBlank @Size(max = 200) String password,
                   @Size(max = 120) String deviceName) {
    }
}
