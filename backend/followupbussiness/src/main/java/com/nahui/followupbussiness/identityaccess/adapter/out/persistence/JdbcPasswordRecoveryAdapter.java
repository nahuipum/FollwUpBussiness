package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryPort;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcPasswordRecoveryAdapter implements PasswordRecoveryPort {
    private final JdbcTemplate jdbc;

    public JdbcPasswordRecoveryAdapter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Account findEligibleByIdentifier(String identifier) {
        return jdbc.query("SELECT id,company_id,status FROM identity_access_account WHERE login_identifier=? AND status IN ('ACTIVE','INVITED') ORDER BY created_at,id LIMIT 2", (rs, n) -> new Account(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3)), identifier).stream().reduce((a, b) -> null).orElse(null);
    }

    public void replaceToken(Token token) {
        Instant now = Instant.now();
        // The account row is the PostgreSQL serialization point for latest-wins issuance.
        jdbc.queryForObject("SELECT id FROM identity_access_account WHERE id=? AND company_id IS NOT DISTINCT FROM ? FOR UPDATE", UUID.class, token.accountId(), token.tenantId());
        jdbc.update("UPDATE identity_access_action_token SET invalidated_at=COALESCE(invalidated_at,?) WHERE account_id=? AND purpose=? AND used_at IS NULL AND invalidated_at IS NULL", Timestamp.from(now), token.accountId(), token.purpose().name());
        jdbc.update("INSERT INTO identity_access_action_token(id,account_id,company_id,purpose,token_digest,expires_at,created_at) VALUES (?,?,?,?,?,?,?)", UUID.randomUUID(), token.accountId(), token.tenantId(), token.purpose().name(), token.digest(), Timestamp.from(token.expiresAt()), Timestamp.from(now));
    }

    public Token consume(byte[] digest, Instant now) {
        return jdbc.query("UPDATE identity_access_action_token SET used_at=? WHERE id=(SELECT id FROM identity_access_action_token WHERE token_digest=? AND used_at IS NULL AND invalidated_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE) RETURNING account_id,company_id,purpose,token_digest,expires_at", (rs, n) -> new Token(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), Purpose.valueOf(rs.getString(3)), rs.getBytes(4), rs.getTimestamp(5).toInstant()), Timestamp.from(now), digest).stream().findFirst().orElse(null);
    }

    public void resetAccount(UUID account, UUID tenant, String hash, boolean activation, Instant now) {
        int updated = jdbc.update("UPDATE identity_access_account SET password_hash=?, status=CASE WHEN ? THEN 'ACTIVE' ELSE status END, credential_version=credential_version+1, updated_at=? WHERE id=? AND company_id IS NOT DISTINCT FROM ? AND (NOT ? OR status='INVITED')", hash, activation, Timestamp.from(now), account, tenant, activation);
        if (updated != 1) throw new IllegalStateException("Action token account state changed");
    }

    public void invalidateAccountTokens(UUID account, Instant now) {
        jdbc.update("UPDATE identity_access_action_token SET invalidated_at=COALESCE(invalidated_at,?) WHERE account_id=? AND used_at IS NULL", Timestamp.from(now), account);
    }
}
