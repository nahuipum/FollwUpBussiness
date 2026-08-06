package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.ProvisionInitialCompanyAdminResult;
import com.nahui.followupbussiness.identityaccess.application.port.out.InitialCompanyAdminStore;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcInitialCompanyAdminStore implements InitialCompanyAdminStore {
    private final JdbcTemplate jdbc; public JdbcInitialCompanyAdminStore(JdbcTemplate jdbc) { this.jdbc=jdbc; }
    @Override public boolean create(UUID id, UUID companyId, String login, String hash, String name, String email) {
        try { return jdbc.update("INSERT INTO identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) VALUES (?,?,?,'COMPANY_ADMIN',?,'INVITED',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)", id,login,hash,companyId,name,email)==1; }
        catch (DuplicateKeyException e) { return false; }
    }
    @Override public ProvisionInitialCompanyAdminResult created(UUID id) { return jdbc.queryForObject("SELECT id,display_name,login_identifier,email,created_at,updated_at FROM identity_access_account WHERE id=?", (rs,n)->new ProvisionInitialCompanyAdminResult(rs.getObject(1,UUID.class),rs.getString(2),rs.getString(3),rs.getString(4),rs.getTimestamp(5).toInstant(),rs.getTimestamp(6).toInstant()),id); }
}
