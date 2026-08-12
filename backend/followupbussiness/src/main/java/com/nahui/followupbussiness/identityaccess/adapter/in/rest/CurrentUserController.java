package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@ConditionalOnProperty(prefix = "followupbussiness.authentication", name = "rs256-private-key")
public final class CurrentUserController {
    private final CurrentUserProjection projection;
    CurrentUserController(CurrentUserProjection projection) { this.projection = projection; }

    @GetMapping("/me")
    ResponseEntity<?> current(@AuthenticationPrincipal AuthenticatedActor actor) {
        if (actor == null) return unauthenticated();
        try {
            return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(projection.from(actor));
        } catch (CurrentUserProjection.Unauthenticated e) {
            return unauthenticated();
        }
    }

    private static ResponseEntity<ProblemDetail> unauthenticated() {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Authentication failed");
        problem.setType(URI.create("urn:followupbussiness:auth:authentication_failed"));
        problem.setProperty("code", "AUTHENTICATION_FAILED");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).header(HttpHeaders.CACHE_CONTROL, "no-store").body(problem);
    }
}
