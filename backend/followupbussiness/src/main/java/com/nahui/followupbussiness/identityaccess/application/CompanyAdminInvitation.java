package com.nahui.followupbussiness.identityaccess.application;

import java.time.Instant;
import java.util.UUID;

/** Safe platform view of an administrator activation invitation. */
public record CompanyAdminInvitation(UUID id, String displayName, String email, String accountStatus,
        DeliveryStatus deliveryStatus, Instant createdAt, Instant deliveredAt, int deliveryAttempts) {
    public enum DeliveryStatus { PENDING, SENT, FAILED, ACCEPTED }
}
