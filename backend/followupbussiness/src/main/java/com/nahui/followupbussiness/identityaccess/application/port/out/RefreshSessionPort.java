package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.time.Instant;
import java.util.UUID;

public interface RefreshSessionPort {
    Resolution resolve(byte[] refreshDigest);
    Rotation rotate(Resolution family, byte[] presentedDigest, byte[] nextDigest, byte[] nextCsrfDigest, Instant now);
    void revoke(UUID familyId, Instant now);
    record Resolution(UUID familyId, UUID accountId, UUID companyId, String channel, byte[] clientDigest,
                      byte[] csrfDigest, Instant expiresAt, Instant revokedAt, Instant lastRotatedAt, boolean current) {}
    record Rotation(boolean rotated, Instant consumedAt) {}
}
