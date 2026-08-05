package com.nahui.followupbussiness.audit.application;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/** Technical-only evidence for an anonymous authentication operation. */
public record RecordAuthenticationAuditCommand(UUID accountId, UUID sessionFamilyId, UUID tenantId,
                                               UUID correlationId, Channel channel, Result result,
                                               Instant occurredAt, Reason reason) {
    public enum Channel { WEB, MOBILE }
    public enum Result { REFRESHED, ALREADY_ROTATED, REUSED, REJECTED, RATE_LIMITED, UNAVAILABLE, LOGGED_OUT }
    public enum Reason { INVALID, EXPIRED, REVOKED, CHANNEL_MISMATCH, CLIENT_MISMATCH, CSRF_INVALID, REPLAY, GLOBAL }
    public RecordAuthenticationAuditCommand {
        if (accountId == null || sessionFamilyId == null || correlationId == null || channel == null || result == null || occurredAt == null)
            throw new IllegalArgumentException("authentication audit technical context is required");
        if (reason != null && !Set.of(Reason.values()).contains(reason)) throw new IllegalArgumentException("unsupported reason");
    }
}
