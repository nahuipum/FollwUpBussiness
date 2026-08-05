package com.nahui.followupbussiness.notifications.adapter.out.persistence;

import com.nahui.followupbussiness.notifications.application.port.in.RevokeInstallationsForSession;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

/** Notifications-owned storage; it deliberately has no identityaccess dependency. */
public final class JdbcInstallationRevocationAdapter implements RevokeInstallationsForSession {
 private final JdbcTemplate jdbc; public JdbcInstallationRevocationAdapter(JdbcTemplate jdbc){this.jdbc=jdbc;}
 public void revoke(UUID family, UUID tenant){jdbc.update("UPDATE notification_installation SET revoked_at=COALESCE(revoked_at,?) WHERE session_family_id=? AND tenant_id IS NOT DISTINCT FROM ?",Timestamp.from(Instant.now()),family,tenant);}
}
