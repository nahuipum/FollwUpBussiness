package com.nahui.followupbussiness.identityaccess.application.port.out;
import java.time.Instant;
import java.util.UUID;
public interface SessionFamilyPort {
    void create(UUID id, UUID accountId, UUID companyId, String channel, byte[] clientInstanceDigest, byte[] refreshDigest, byte[] csrfDigest, byte[] ticketDigest, Instant expiresAt, Instant createdAt);
}
