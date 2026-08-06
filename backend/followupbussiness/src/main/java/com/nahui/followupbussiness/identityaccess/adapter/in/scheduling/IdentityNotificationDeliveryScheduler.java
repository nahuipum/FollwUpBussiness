package com.nahui.followupbussiness.identityaccess.adapter.in.scheduling;

import com.nahui.followupbussiness.identityaccess.application.IdentityNotificationDeliveryWorker;
import org.springframework.scheduling.annotation.Scheduled;

/** Polls the encrypted identity queue only when an environment gateway is configured. */
public final class IdentityNotificationDeliveryScheduler {
    private final IdentityNotificationDeliveryWorker worker;
    public IdentityNotificationDeliveryScheduler(IdentityNotificationDeliveryWorker worker) { this.worker = worker; }
    @Scheduled(fixedDelayString = "${followupbussiness.identity-notification.poll-delay-ms:1000}")
    public void deliverDue() { worker.dispatchAvailable(25); }
}
