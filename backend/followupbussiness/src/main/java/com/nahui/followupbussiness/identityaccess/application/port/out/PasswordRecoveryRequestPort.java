package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Durable intake for a recovery request before any account state is resolved.
 */
public interface PasswordRecoveryRequestPort {
    void accept(String identifier, Instant now);

    List<Request> claimDue(Instant now, int limit);

    void completed(UUID id, Instant now);

    void retry(UUID id, Instant nextAttemptAt);

    record Request(UUID id, String identifier, int attemptCount) {
    }
}
