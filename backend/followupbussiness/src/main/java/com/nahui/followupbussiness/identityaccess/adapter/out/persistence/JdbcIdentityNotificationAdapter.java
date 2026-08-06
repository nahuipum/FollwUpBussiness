package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.IdentityNotificationPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.IdentityNotificationWorkPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryPort;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Stores encrypted delivery material; neither tokens nor identifiers are logged or put in an event.
 */
public final class JdbcIdentityNotificationAdapter implements IdentityNotificationPort, IdentityNotificationWorkPort {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final JdbcTemplate jdbc;
    private final byte[] key;

    public JdbcIdentityNotificationAdapter(JdbcTemplate jdbc, byte[] hmacKey) {
        this.jdbc = jdbc;
        this.key = key(hmacKey);
    }

    public void enqueue(UUID account, UUID tenant, PasswordRecoveryPort.Purpose purpose, String identifier, String token, Instant expires) {
        byte[] nonce = new byte[12];
        RANDOM.nextBytes(nonce);
        byte[] encrypted = encrypt((identifier + "\n" + token).getBytes(StandardCharsets.UTF_8), nonce);
        jdbc.update("UPDATE identity_access_notification SET superseded_at=COALESCE(superseded_at,CURRENT_TIMESTAMP) WHERE account_id=? AND purpose=? AND superseded_at IS NULL AND delivered_at IS NULL", account, purpose.name());
        jdbc.update("INSERT INTO identity_access_notification(id,account_id,company_id,purpose,payload_ciphertext,payload_digest,expires_at,next_attempt_at,created_at) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT (account_id,purpose,payload_digest) DO NOTHING", UUID.randomUUID(), account, tenant, purpose.name(), ByteBuffer.allocate(nonce.length + encrypted.length).put(nonce).put(encrypted).array(), digest(identifier + "\n" + token), java.sql.Timestamp.from(expires));
    }

    @Override public java.util.List<Work> claimDue(Instant now, int limit) {
        return jdbc.query("""
                WITH due AS (SELECT id FROM identity_access_notification
                  WHERE delivered_at IS NULL AND superseded_at IS NULL AND next_attempt_at <= ?
                  ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT ?)
                UPDATE identity_access_notification n SET next_attempt_at=? FROM due
                WHERE n.id=due.id RETURNING n.id,n.company_id,n.payload_ciphertext,n.expires_at,n.attempt_count
                """, (rs, row) -> new Work((UUID) rs.getObject(1), (UUID) rs.getObject(2), decrypt(rs.getBytes(3)), rs.getTimestamp(4).toInstant(), rs.getInt(5)), java.sql.Timestamp.from(now), limit, java.sql.Timestamp.from(now.plusSeconds(30)));
    }
    @Override public void delivered(UUID id, UUID tenant, Instant now) { requireSingleTransition(jdbc.update("UPDATE identity_access_notification SET delivered_at=?,payload_ciphertext=decode('','hex') WHERE id=? AND company_id IS NOT DISTINCT FROM ? AND delivered_at IS NULL AND superseded_at IS NULL", java.sql.Timestamp.from(now), id, tenant)); }
    @Override public void retry(UUID id, UUID tenant, Instant at) { requireSingleTransition(jdbc.update("UPDATE identity_access_notification SET attempt_count=attempt_count+1,next_attempt_at=? WHERE id=? AND company_id IS NOT DISTINCT FROM ? AND delivered_at IS NULL AND superseded_at IS NULL", java.sql.Timestamp.from(at), id, tenant)); }
    @Override public void erase(UUID id, UUID tenant, Instant now) { requireSingleTransition(jdbc.update("UPDATE identity_access_notification SET superseded_at=?,payload_ciphertext=decode('','hex') WHERE id=? AND company_id IS NOT DISTINCT FROM ? AND delivered_at IS NULL AND superseded_at IS NULL", java.sql.Timestamp.from(now), id, tenant)); }

    private static void requireSingleTransition(int affected) {
        if (affected != 1) throw new IllegalStateException("Identity notification transition did not affect exactly one row");
    }

    private Delivery decrypt(byte[] sealed) {
        try { byte[] nonce=java.util.Arrays.copyOfRange(sealed,0,12); Cipher c=Cipher.getInstance("AES/GCM/NoPadding"); c.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,nonce)); String[] fields=new String(c.doFinal(java.util.Arrays.copyOfRange(sealed,12,sealed.length)),StandardCharsets.UTF_8).split("\\n",2); return new Delivery(fields[0],fields[1]); }
        catch (Exception e) { throw new IllegalStateException("Unable to decrypt identity notification", e); }
    }

    private byte[] encrypt(byte[] plain, byte[] nonce) {
        try {
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, nonce));
            return c.doFinal(plain);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to encrypt identity notification", e);
        }
    }

    private byte[] digest(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to deduplicate identity notification", e);
        }
    }

    private static byte[] key(byte[] secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] v = mac.doFinal("identity-notification-encryption".getBytes(StandardCharsets.UTF_8));
            return java.util.Arrays.copyOf(v, 16);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid encryption key", e);
        }
    }
}
