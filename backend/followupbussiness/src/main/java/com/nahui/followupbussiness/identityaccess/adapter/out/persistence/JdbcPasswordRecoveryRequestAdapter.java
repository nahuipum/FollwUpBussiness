package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryRequestPort;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.jdbc.core.JdbcTemplate;

/** Encrypted durable intake; it deliberately contains no resolved account or token. */
public final class JdbcPasswordRecoveryRequestAdapter implements PasswordRecoveryRequestPort {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final JdbcTemplate jdbc;
    private final byte[] key;

    public JdbcPasswordRecoveryRequestAdapter(JdbcTemplate jdbc, byte[] secret) {
        this.jdbc = jdbc;
        this.key = key(secret);
    }

    @Override
    public void accept(String identifier, Instant now) {
        byte[] nonce = new byte[12];
        RANDOM.nextBytes(nonce);
        byte[] encrypted = encrypt(identifier.getBytes(StandardCharsets.UTF_8), nonce);
        jdbc.update("INSERT INTO identity_access_recovery_request(id,identifier_ciphertext,identifier_digest,next_attempt_at,created_at) VALUES (?,?,?,?,?) ON CONFLICT (identifier_digest) WHERE completed_at IS NULL DO UPDATE SET identifier_ciphertext=EXCLUDED.identifier_ciphertext,next_attempt_at=EXCLUDED.next_attempt_at,created_at=EXCLUDED.created_at", UUID.randomUUID(), ByteBuffer.allocate(nonce.length + encrypted.length).put(nonce).put(encrypted).array(), digest(identifier), Timestamp.from(now), Timestamp.from(now));
    }

    @Override
    public List<Request> claimDue(Instant now, int limit) {
        return jdbc.query("""
                WITH due AS (SELECT id FROM identity_access_recovery_request
                  WHERE completed_at IS NULL AND next_attempt_at <= ?
                  ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT ?)
                UPDATE identity_access_recovery_request r SET next_attempt_at=? FROM due
                WHERE r.id=due.id RETURNING r.id,r.identifier_ciphertext,r.attempt_count
                """, (rs, row) -> new Request(rs.getObject(1, UUID.class), decrypt(rs.getBytes(2)), rs.getInt(3)), Timestamp.from(now), limit, Timestamp.from(now.plusSeconds(30)));
    }

    @Override
    public void completed(UUID id, Instant now) {
        jdbc.update("UPDATE identity_access_recovery_request SET completed_at=?,identifier_ciphertext=decode('','hex') WHERE id=? AND completed_at IS NULL", Timestamp.from(now), id);
    }

    @Override
    public void retry(UUID id, Instant nextAttemptAt) {
        jdbc.update("UPDATE identity_access_recovery_request SET attempt_count=attempt_count+1,next_attempt_at=? WHERE id=? AND completed_at IS NULL", Timestamp.from(nextAttemptAt), id);
    }

    private String decrypt(byte[] sealed) {
        try {
            var cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, sealed, 0, 12));
            return new String(cipher.doFinal(sealed, 12, sealed.length - 12), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to decrypt password recovery request", e);
        }
    }

    private byte[] encrypt(byte[] plain, byte[] nonce) {
        try {
            var cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, nonce));
            return cipher.doFinal(plain);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to encrypt password recovery request", e);
        }
    }

    private byte[] digest(String identifier) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(identifier.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to deduplicate password recovery request", e);
        }
    }

    private static byte[] key(byte[] secret) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return java.util.Arrays.copyOf(mac.doFinal("password-recovery-request-encryption".getBytes(StandardCharsets.UTF_8)), 16);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid recovery request encryption key", e);
        }
    }
}
