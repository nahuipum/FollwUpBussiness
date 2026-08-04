package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import com.nahui.followupbussiness.identityaccess.adapter.out.security.Rs256AccessTokenAdapter;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.security.KeyPairGenerator;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class InboundJwtAuthenticatorTest {
    @Test
    void acceptsSignedCompanyTokenOnlyWhenItsTenantComesFromThePersistedSession() throws Exception {
        var keys = KeyPairGenerator.getInstance("RSA"); keys.initialize(2048); var pair = keys.generateKeyPair();
        Instant now = Instant.parse("2026-08-04T12:00:00Z"); UUID subject = UUID.randomUUID(); UUID session = UUID.randomUUID();
        String token = new Rs256AccessTokenAdapter(pair.getPrivate(), "kid", "issuer", "audience", Clock.fixed(now, ZoneOffset.UTC))
                .issue(subject, session, UUID.randomUUID(), BaseRole.SELLER);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        UUID tenant = UUID.randomUUID();
        when(jdbc.query(any(String.class), any(org.springframework.jdbc.core.RowMapper.class), any(), any(), any(), any()))
                .thenReturn(java.util.List.of(tenant));
        var authenticator = new InboundJwtAuthenticator(pair.getPublic(), "issuer", "audience", jdbc, Clock.fixed(now, ZoneOffset.UTC));

        var authentication = authenticator.authenticate(token);

        assertThat(authentication.getName()).isEqualTo(subject.toString());
        assertThat(authentication.getAuthorities()).extracting("authority").containsExactly("SELLER");
        assertThat(((com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor) authentication.getPrincipal()).tenantId()).isEqualTo(tenant);
        org.mockito.Mockito.verify(jdbc).query(org.mockito.ArgumentMatchers.argThat(sql ->
                sql.contains("LEFT JOIN tenancy_company company") && sql.contains("company.status = 'ACTIVE'")),
                any(org.springframework.jdbc.core.RowMapper.class), any(), any(), any(), any());
        assertThatThrownBy(() -> authenticator.authenticate(token.substring(0, token.length() - 2) + "aa"))
                .isInstanceOf(InboundJwtAuthenticator.JwtValidationException.class);
    }

    @Test
    void rejectsWhenThePersistedSessionDoesNotResolveExactlyOneActor() throws Exception {
        var keys = KeyPairGenerator.getInstance("RSA"); keys.initialize(2048); var pair = keys.generateKeyPair();
        Instant now = Instant.parse("2026-08-04T12:00:00Z");
        String token = new Rs256AccessTokenAdapter(pair.getPrivate(), "kid", "issuer", "audience", Clock.fixed(now, ZoneOffset.UTC))
                .issue(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), BaseRole.SELLER);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(any(String.class), any(org.springframework.jdbc.core.RowMapper.class), any(), any(), any(), any())).thenReturn(java.util.List.of());
        var authenticator = new InboundJwtAuthenticator(pair.getPublic(), "issuer", "audience", jdbc, Clock.fixed(now, ZoneOffset.UTC));

        assertThatThrownBy(() -> authenticator.authenticate(token)).isInstanceOf(InboundJwtAuthenticator.JwtValidationException.class);
    }

    @Test
    void acceptsPlatformTokenOnlyWhenThePersistedActorHasNoTenant() throws Exception {
        var keys = KeyPairGenerator.getInstance("RSA"); keys.initialize(2048); var pair = keys.generateKeyPair();
        Instant now = Instant.parse("2026-08-04T12:00:00Z");
        String token = new Rs256AccessTokenAdapter(pair.getPrivate(), "kid", "issuer", "audience", Clock.fixed(now, ZoneOffset.UTC))
                .issue(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(anyString(), any(org.springframework.jdbc.core.RowMapper.class), any(), any(), any(), any()))
                .thenReturn(java.util.Collections.singletonList(null));
        var authenticator = new InboundJwtAuthenticator(pair.getPublic(), "issuer", "audience", jdbc, Clock.fixed(now, ZoneOffset.UTC));

        var authentication = authenticator.authenticate(token);

        assertThat(((com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor) authentication.getPrincipal()).tenantId()).isNull();
    }

    @Test
    void rejectsCompanyTokenWhenTheDurableCompanyIsSuspended() throws Exception {
        var authenticator = authenticatorReturningNoActiveCompany();

        assertThatThrownBy(() -> authenticator.authenticator().authenticate(companyToken(authenticator, BaseRole.COMPANY_ADMIN)))
                .isInstanceOf(InboundJwtAuthenticator.JwtValidationException.class);
    }

    @Test
    void rejectsCompanyTokenWhenTheDurableCompanyNoLongerExists() throws Exception {
        var authenticator = authenticatorReturningNoActiveCompany();

        assertThatThrownBy(() -> authenticator.authenticator().authenticate(companyToken(authenticator, BaseRole.SELLER)))
                .isInstanceOf(InboundJwtAuthenticator.JwtValidationException.class);
    }

    private TestAuthenticator authenticatorReturningNoActiveCompany() throws Exception {
        var keys = KeyPairGenerator.getInstance("RSA"); keys.initialize(2048); var pair = keys.generateKeyPair();
        Instant now = Instant.parse("2026-08-04T12:00:00Z");
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(anyString(), any(org.springframework.jdbc.core.RowMapper.class), any(), any(), any(), any()))
                .thenReturn(java.util.List.of());
        return new TestAuthenticator(
                new InboundJwtAuthenticator(pair.getPublic(), "issuer", "audience", jdbc, Clock.fixed(now, ZoneOffset.UTC)),
                new Rs256AccessTokenAdapter(pair.getPrivate(), "kid", "issuer", "audience", Clock.fixed(now, ZoneOffset.UTC)));
    }

    private String companyToken(TestAuthenticator authenticator, BaseRole role) {
        return authenticator.tokens().issue(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), role);
    }

    private record TestAuthenticator(InboundJwtAuthenticator authenticator, Rs256AccessTokenAdapter tokens) { }
}
