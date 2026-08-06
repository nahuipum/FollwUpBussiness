package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.time.Instant;
import java.util.UUID;

/**
 * Durable authority for one-time identity actions.
 */
public interface PasswordRecoveryPort {
    Account findEligibleByIdentifier(String identifier);

    void replaceToken(Token token);

    Token consume(byte[] digest, Instant now);

    void resetAccount(UUID accountId, UUID tenantId, String passwordHash, boolean activation, Instant now);

    void invalidateAccountTokens(UUID accountId, Instant now);

    record Account(UUID id, UUID tenantId, String status) {
    }

    record Token(UUID accountId, UUID tenantId, Purpose purpose, byte[] digest, Instant expiresAt) {
    }

    enum Purpose {PASSWORD_RESET, ACTIVATION}
}
