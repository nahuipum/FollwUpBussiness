package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.RefreshSessionPort;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcRefreshSessionAdapter implements RefreshSessionPort {
    private final JdbcTemplate jdbc;

    public JdbcRefreshSessionAdapter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Resolution resolve(byte[] digest) {
        List<Resolution> rows = jdbc.query("SELECT id,account_id,company_id,channel,client_instance_digest,csrf_token_digest,expires_at,revoked_at,refresh_rotated_at FROM identity_access_session_family WHERE refresh_token_digest=? FOR UPDATE", (rs, n) -> new Resolution(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getObject(3, UUID.class), rs.getString(4), rs.getBytes(5), rs.getBytes(6), rs.getTimestamp(7).toInstant(), rs.getTimestamp(8) == null ? null : rs.getTimestamp(8).toInstant(), rs.getTimestamp(9) == null ? null : rs.getTimestamp(9).toInstant(), true), digest);
        if (!rows.isEmpty()) return rows.getFirst();
        return jdbc.query("SELECT f.id,f.account_id,f.company_id,f.channel,f.client_instance_digest,f.csrf_token_digest,f.expires_at,f.revoked_at,f.refresh_rotated_at FROM identity_access_consumed_refresh_token c JOIN identity_access_session_family f ON f.id=c.family_id WHERE c.refresh_token_digest=? FOR UPDATE", (rs, n) -> new Resolution(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getObject(3, UUID.class), rs.getString(4), rs.getBytes(5), rs.getBytes(6), rs.getTimestamp(7).toInstant(), rs.getTimestamp(8) == null ? null : rs.getTimestamp(8).toInstant(), rs.getTimestamp(9) == null ? null : rs.getTimestamp(9).toInstant(), false), digest).stream().findFirst().orElse(null);
    }

    public Rotation rotate(Resolution f, byte[] presented, byte[] next, byte[] nextCsrf, Instant now) {
        int updated = jdbc.update("UPDATE identity_access_session_family SET refresh_token_digest=?, csrf_token_digest=?, refresh_rotated_at=? WHERE id=? AND refresh_token_digest=? AND revoked_at IS NULL AND expires_at>?", next, nextCsrf, Timestamp.from(now), f.familyId(), presented, Timestamp.from(now));
        if (updated == 1)
            jdbc.update("INSERT INTO identity_access_consumed_refresh_token(refresh_token_digest,family_id,consumed_at,channel,client_instance_digest) VALUES (?,?,?,?,?)", presented, f.familyId(), Timestamp.from(now), f.channel(), f.clientDigest());
        return new Rotation(updated == 1, now);
    }

    public void revoke(UUID id, Instant now) {
        jdbc.update("UPDATE identity_access_session_family SET revoked_at=COALESCE(revoked_at,?) WHERE id=?", Timestamp.from(now), id);
    }
}
