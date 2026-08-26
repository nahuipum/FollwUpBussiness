package com.nahui.followupbussiness.notifications.adapter.out.persistence;

import com.nahui.followupbussiness.notifications.application.port.out.NotificationDeliveryStore;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcNotificationDeliveryStore implements NotificationDeliveryStore {
    private final JdbcTemplate jdbc;
    public JdbcNotificationDeliveryStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public Optional<Installation> findActiveInstallation(UUID tenant, UUID user) {
        return jdbc.query("select id,tenant_id,user_id,session_family_id,adapter_id,push_token_protected from notification_installation where tenant_id=? and user_id=? and revoked_at is null order by updated_at desc limit 1", rs -> rs.next() ? Optional.of(new Installation(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getObject(3, UUID.class), rs.getObject(4, UUID.class), rs.getString(5), rs.getString(6))) : Optional.empty(), tenant, user);
    }
    @Override public boolean reserve(UUID tenant, UUID event, UUID recipient, String type, Instant now) {
        return jdbc.update("insert into notification_route_delivery(tenant_id,event_id,recipient_technical_id,notification_type,status,created_at,updated_at) values(?,?,?,?, 'RESERVED',?,?) on conflict (tenant_id,event_id,recipient_technical_id,notification_type) do update set status='RESERVED',updated_at=excluded.updated_at where notification_route_delivery.status='RETRYABLE'", tenant,event,recipient,type,Timestamp.from(now),Timestamp.from(now)) == 1;
    }
    @Override public void retryable(UUID tenant, UUID event, UUID recipient, String type, Instant now) { jdbc.update("update notification_route_delivery set status='RETRYABLE',updated_at=? where tenant_id=? and event_id=? and recipient_technical_id=? and notification_type=? and status='RESERVED'", Timestamp.from(now),tenant,event,recipient,type); }
    @Override public void delivered(UUID tenant, UUID event, UUID recipient, String type, Instant now) { jdbc.update("update notification_route_delivery set status='DELIVERED',updated_at=? where tenant_id=? and event_id=? and recipient_technical_id=? and notification_type=?", Timestamp.from(now),tenant,event,recipient,type); }
    @Override public void revoke(UUID installation, Instant now) { jdbc.update("update notification_installation set revoked_at=coalesce(revoked_at,?),updated_at=? where id=?", Timestamp.from(now),Timestamp.from(now),installation); }
}
