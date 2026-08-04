package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.LoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

public final class JdbcLoginAccountQuery implements LoginAccountQuery {
    private final JdbcTemplate jdbc;

    public JdbcLoginAccountQuery(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Account> findByIdentifier(String identifier) {
        var accounts = jdbc.query("SELECT id,password_hash,role_code,company_id,status,display_name,email FROM identity_access_account WHERE login_identifier=? ORDER BY created_at,id LIMIT 2", (rs, n) -> new Account(rs.getObject(1, UUID.class), rs.getString(2), BaseRole.findByCode(rs.getString(3)).orElseThrow(), rs.getObject(4, UUID.class), rs.getString(5), rs.getString(6), rs.getString(7)), identifier);
        return accounts.size() == 1 ? Optional.of(accounts.getFirst()) : Optional.empty();
    }
}
