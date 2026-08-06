package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.time.Instant;
import java.util.UUID;
import java.util.List;

public interface RefreshSessionPort {
    Resolution resolve(byte[] refreshDigest);

    Rotation rotate(Resolution family, byte[] presentedDigest, byte[] nextDigest, byte[] nextCsrfDigest, Instant now);

    void revoke(UUID familyId, Instant now);

    default void revokeAll(UUID accountId, UUID tenantId, Instant now) { throw new UnsupportedOperationException(); }

    default Resolution consumeRevocationTicket(byte[] ticketDigest, Instant now) { throw new UnsupportedOperationException(); }

    default Resolution resolveById(UUID familyId, UUID accountId, UUID tenantId) { throw new UnsupportedOperationException(); }
    default List<UUID> activeFamilyIds(UUID accountId, UUID tenantId) { throw new UnsupportedOperationException(); }

    record Resolution(UUID familyId, UUID accountId, UUID companyId, String channel, byte[] clientDigest,
                      byte[] csrfDigest, Instant expiresAt, Instant revokedAt, Instant lastRotatedAt, boolean current) {
    }

    record Rotation(boolean rotated, Instant consumedAt) {
    }
}
