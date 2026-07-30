package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.PlatformSuperadminAccountRepository;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.identityaccess.domain.model.LoginIdentifier;
import com.nahui.followupbussiness.identityaccess.domain.model.PlatformSuperadminAccount;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

public final class JdbcPlatformSuperadminAccountRepository
        implements PlatformSuperadminAccountRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcPlatformSuperadminAccountRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<ExistingAccount> findAnyByLoginIdentifier(LoginIdentifier loginIdentifier) {
        List<ExistingAccount> accounts = jdbcTemplate.query(
                """
                SELECT id, role_code, company_id
                FROM identity_access_account
                WHERE login_identifier = ?
                ORDER BY created_at, id
                LIMIT 1
                """,
                JdbcPlatformSuperadminAccountRepository::mapExistingAccount,
                loginIdentifier.value());
        return accounts.stream().findFirst();
    }

    @Override
    public Optional<ExistingAccount> findPlatformSuperadmin() {
        List<ExistingAccount> accounts = jdbcTemplate.query(
                """
                SELECT id, role_code, company_id
                FROM identity_access_account
                WHERE role_code = 'PLATFORM_SUPERADMIN'
                ORDER BY created_at, id
                LIMIT 1
                """,
                JdbcPlatformSuperadminAccountRepository::mapExistingAccount);
        return accounts.stream().findFirst();
    }

    @Override
    public boolean insertIfAbsent(PlatformSuperadminAccount account) {
        int updated = jdbcTemplate.update(
                """
                INSERT INTO identity_access_account(
                    id,
                    login_identifier,
                    password_hash,
                    role_code,
                    company_id,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT DO NOTHING
                """,
                account.id(),
                account.loginIdentifier().value(),
                account.passwordHash(),
                account.role().code(),
                account.companyId(),
                Timestamp.from(account.createdAt()));
        return updated == 1;
    }

    private static ExistingAccount mapExistingAccount(ResultSet resultSet, int rowNumber)
            throws SQLException {
        return new ExistingAccount(
                resultSet.getObject("id", java.util.UUID.class),
                BaseRole.findByCode(resultSet.getString("role_code"))
                        .orElseThrow(() -> new IllegalStateException(
                                "Persisted account contains an unsupported role")),
                resultSet.getObject("company_id", java.util.UUID.class));
    }
}
