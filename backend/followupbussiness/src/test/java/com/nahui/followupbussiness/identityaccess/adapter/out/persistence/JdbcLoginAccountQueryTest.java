package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;

import com.nahui.followupbussiness.identityaccess.application.port.out.LoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JdbcLoginAccountQueryTest {

    @Test
    void resolvesAUniqueAccountByCanonicalUsernameOrEmail() {
        LoginAccountQuery.Account account = account("user@example.test");
        CapturingJdbcTemplate jdbc = new CapturingJdbcTemplate(List.of(account));

        assertThat(new JdbcLoginAccountQuery(jdbc).findByIdentifier(" User@Example.Test ")).contains(account);
        assertThat(jdbc.sql).contains("login_identifier=? OR lower(btrim(email))=?");
        assertThat(jdbc.arguments).containsExactly("user@example.test", "user@example.test");
    }

    @Test
    void rejectsAnIdentifierThatMatchesMoreThanOneTenantAccount() {
        CapturingJdbcTemplate jdbc = new CapturingJdbcTemplate(List.of(
                account("shared@example.test"), account("shared@example.test")));

        assertThat(new JdbcLoginAccountQuery(jdbc).findByIdentifier("shared@example.test")).isEmpty();
    }

    private static LoginAccountQuery.Account account(String email) {
        return new LoginAccountQuery.Account(UUID.randomUUID(), "hash", BaseRole.SELLER, UUID.randomUUID(),
                "ACTIVE", "User", email);
    }

    private static final class CapturingJdbcTemplate extends JdbcTemplate {
        private final List<?> results;
        private String sql;
        private List<Object> arguments;

        private CapturingJdbcTemplate(List<?> results) {
            this.results = results;
        }

        @Override
        @SuppressWarnings("unchecked")
        public <T> List<T> query(String sql, RowMapper<T> rowMapper, Object... args) {
            this.sql = sql;
            this.arguments = Arrays.asList(args);
            return (List<T>) results;
        }
    }
}
