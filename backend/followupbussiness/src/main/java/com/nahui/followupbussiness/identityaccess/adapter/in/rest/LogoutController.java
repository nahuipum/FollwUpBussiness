package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.LogoutSessionService;
import com.nahui.followupbussiness.identityaccess.application.port.in.LogoutSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.WebOriginPolicy;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.net.URI;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@ConditionalOnBean(LogoutSessionUseCase.class)
public final class LogoutController {
    private final LogoutSessionUseCase service;
    private final WebOriginPolicy origins;

    public LogoutController(LogoutSessionUseCase service, WebOriginPolicy origins) {
        this.service = service;
        this.origins = origins;
    }

    @PostMapping("/logout")
    ResponseEntity<?> logout(@AuthenticationPrincipal AuthenticatedActor actor, @Valid @RequestBody(required = false) Body body,
                             @RequestHeader(value = "X-Logout-Intent", required = false) String intent, @RequestHeader(value = "X-Session-Revocation-Ticket", required = false) String ticket, @RequestHeader(value = "X-CSRF-Token", required = false) String csrf,
                             @CookieValue(value = "__Host-fs-refresh", required = false) String cookie, HttpServletRequest request, HttpServletResponse response) {
        UUID correlation = correlation(request);
        boolean allSessions = body != null && body.allSessions();
        boolean pending = "PENDING".equals(intent);
        boolean browser = request.getHeader("Origin") != null || request.getHeader("Sec-Fetch-Site") != null;
        if (pending) {
            if (actor != null || request.getHeader("Authorization") != null || allSessions || (cookie == null) == (ticket == null))
                return problem(400, correlation);
            if (cookie != null && (!browser || !origins.isAllowed(request.getHeader("Origin"))))
                return problem(400, correlation);
            if (ticket != null && browser)
                return problem(400, correlation); // tickets are mobile-only and mobile has no browser context
        } else if (actor == null || ticket != null || intent != null)
            return problem(401, correlation);
        try {
            service.logout(new LogoutSessionUseCase.Command(actor, allSessions, csrf, pending ? ticket : null, pending ? cookie : null, correlation));
            response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
            response.setHeader("X-Correlation-Id", correlation.toString());
            if (pending && cookie != null)
                response.addHeader(HttpHeaders.SET_COOKIE, "__Host-fs-refresh=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict");
            return ResponseEntity.noContent().build();
        } catch (LogoutSessionService.Rejected e) {
            return problem(401, correlation);
        }
    }

    private static UUID correlation(HttpServletRequest r) {
        try {
            return UUID.fromString(r.getHeader("X-Correlation-Id"));
        } catch (Exception e) {
            return UUID.randomUUID();
        }
    }

    private static ResponseEntity<ProblemDetail> problem(int status, UUID c) {
        var p = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(status), "Request cannot be processed");
        p.setType(URI.create("urn:followupbussiness:auth:logout-invalid"));
        p.setProperty("code", "LOGOUT_INVALID");
        p.setProperty("correlationId", c.toString());
        return ResponseEntity.status(status).header(HttpHeaders.CACHE_CONTROL, "no-store").header("X-Correlation-Id", c.toString()).body(p);
    }

    record Body(boolean allSessions) { }
}
