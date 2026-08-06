package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryRequestPort;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;

/** Processes accepted recovery requests outside the inbound HTTP path. */
public final class PasswordRecoveryRequestWorker {
    private final PasswordRecoveryRequestPort requests;
    private final PasswordRecoveryService recovery;
    private final Clock clock;

    public PasswordRecoveryRequestWorker(PasswordRecoveryRequestPort requests, PasswordRecoveryService recovery, Clock clock) {
        this.requests = Objects.requireNonNull(requests);
        this.recovery = Objects.requireNonNull(recovery);
        this.clock = Objects.requireNonNull(clock);
    }

    public void processAvailable(int limit) {
        Instant now = clock.instant();
        for (var request : requests.claimDue(now, limit)) {
            try {
                recovery.request(request.identifier());
                requests.completed(request.id(), now);
            } catch (RuntimeException failure) {
                requests.retry(request.id(), now.plus(retryDelay(request.attemptCount())));
            }
        }
    }

    private static Duration retryDelay(int attemptCount) {
        return Duration.ofSeconds(Math.min(1L << Math.min(attemptCount, 8), 300));
    }
}
