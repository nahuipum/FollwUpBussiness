package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.CompanyAdminInvitation;
import com.nahui.followupbussiness.identityaccess.application.CompanyAdminInvitation.DeliveryStatus;
import com.nahui.followupbussiness.identityaccess.application.port.out.CompanyAdminInvitationQuery;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCompanyAdminInvitationQuery implements CompanyAdminInvitationQuery {
    private final JdbcTemplate jdbc;

    public JdbcCompanyAdminInvitationQuery(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<CompanyAdminInvitation> listByCompany(UUID companyId) {
        return jdbc.query("""
                SELECT a.id,a.display_name,a.email,a.status,a.created_at,n.delivered_at,n.superseded_at,n.attempt_count
                  FROM identity_access_account a
                  LEFT JOIN LATERAL (
                    SELECT delivered_at,superseded_at,attempt_count
                      FROM identity_access_notification
                     WHERE account_id=a.id AND purpose='ACTIVATION'
                     ORDER BY created_at DESC LIMIT 1
                  ) n ON TRUE
                 WHERE a.company_id=? AND a.role_code='COMPANY_ADMIN'
                 ORDER BY a.created_at DESC,a.id DESC
                """, (rs, row) -> {
            String accountStatus = rs.getString("status");
            var deliveredAt = rs.getTimestamp("delivered_at");
            var supersededAt = rs.getTimestamp("superseded_at");
            DeliveryStatus delivery = "ACTIVE".equals(accountStatus) ? DeliveryStatus.ACCEPTED
                    : deliveredAt != null ? DeliveryStatus.SENT
                    : supersededAt != null ? DeliveryStatus.FAILED : DeliveryStatus.PENDING;
            return new CompanyAdminInvitation(rs.getObject("id", UUID.class), rs.getString("display_name"),
                    rs.getString("email"), accountStatus, delivery, rs.getTimestamp("created_at").toInstant(),
                    deliveredAt == null ? null : deliveredAt.toInstant(), rs.getInt("attempt_count"));
        }, companyId);
    }
}
