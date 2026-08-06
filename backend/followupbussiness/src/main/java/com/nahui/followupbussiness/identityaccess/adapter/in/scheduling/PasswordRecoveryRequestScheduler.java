package com.nahui.followupbussiness.identityaccess.adapter.in.scheduling;

import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryRequestWorker;
import org.springframework.scheduling.annotation.Scheduled;

/** Drains accepted recovery requests after their durable HTTP acknowledgement. */
public final class PasswordRecoveryRequestScheduler {
    private final PasswordRecoveryRequestWorker worker;

    public PasswordRecoveryRequestScheduler(PasswordRecoveryRequestWorker worker) {
        this.worker = worker;
    }

    @Scheduled(fixedDelayString = "${followupbussiness.password-recovery.poll-delay-ms:1000}")
    public void processAccepted() {
        worker.processAvailable(25);
    }
}
