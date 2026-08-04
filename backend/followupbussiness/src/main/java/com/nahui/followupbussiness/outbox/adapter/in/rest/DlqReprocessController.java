package com.nahui.followupbussiness.outbox.adapter.in.rest;

import com.nahui.followupbussiness.outbox.application.PlatformOperator;
import com.nahui.followupbussiness.outbox.application.ReprocessOutboxEvent;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;
import java.util.UUID;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/internal/outbox/dlq")
public final class DlqReprocessController {
    private final ReprocessOutboxEvent reprocessOutboxEvent;
    private final DlqReprocessRateLimiter rateLimiter;

    public DlqReprocessController(ReprocessOutboxEvent reprocessOutboxEvent, ObjectProvider<DlqReprocessRateLimiter> rateLimiter) {
        this.reprocessOutboxEvent = reprocessOutboxEvent;
        this.rateLimiter = rateLimiter.getIfAvailable();
    }

    @PostMapping("/{eventId}/reprocess")
    public ResponseEntity<Void> reprocess(@PathVariable UUID eventId, Authentication authentication, HttpServletRequest request) {
        if (authentication == null || authentication.getAuthorities().stream()
                .noneMatch(authority -> Objects.equals(authority.getAuthority(), "PLATFORM_SUPERADMIN"))) {
            throw new AccessDeniedException("DLQ reprocessing requires PLATFORM_SUPERADMIN");
        }
        UUID operatorId;
        try {
            operatorId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new AccessDeniedException("Authenticated operator identity is invalid");
        }
        DlqReprocessRateLimiter.Decision rateLimit;
        if (rateLimiter == null) {
            return ResponseEntity.status(503).build();
        }
        try {
            rateLimit = rateLimiter.check(operatorId.toString(), request.getRemoteAddr());
        } catch (DlqReprocessRateLimiter.UnavailableException exception) {
            return ResponseEntity.status(503).build();
        }
        if (!rateLimit.allowed()) {
            return ResponseEntity.status(429).header(HttpHeaders.RETRY_AFTER, Long.toString(rateLimit.retryAfterSeconds())).build();
        }
        return reprocessOutboxEvent.execute(eventId, new PlatformOperator(operatorId, true))
                ? ResponseEntity.accepted().build()
                : ResponseEntity.notFound().build();
    }
}
