package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import com.nahui.followupbussiness.identityaccess.adapter.out.security.Rs256AccessTokenAdapter;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.Signature;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class InboundJwtAuthenticatorTest {
    @Test
    void rejectsSignedTokenWithFutureNbfBeforeConsultingTheSession() throws Exception {
        var keys = KeyPairGenerator.getInstance("RSA"); keys.initialize(2048); var pair = keys.generateKeyPair();
        Instant now = Instant.parse("2026-08-04T12:00:00Z");
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        var authenticator = new InboundJwtAuthenticator(pair.getPublic(), "issuer", "audience", jdbc, Clock.fixed(now, ZoneOffset.UTC));

        assertThatThrownBy(() -> authenticator.authenticate(futureNbfToken(pair.getPrivate(), now)))
                .isInstanceOf(InboundJwtAuthenticator.JwtValidationException.class);

        verifyNoInteractions(jdbc);
    }

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
        int signatureStart = token.lastIndexOf('.') + 1;
        String tamperedToken = token.substring(0, signatureStart)
                + (token.charAt(signatureStart) == 'A' ? 'B' : 'A')
                + token.substring(signatureStart + 1);
        assertThatThrownBy(() -> authenticator.authenticate(tamperedToken))
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

    private static String futureNbfToken(PrivateKey key, Instant now) throws Exception {
        String header = encoded("{\"alg\":\"RS256\",\"typ\":\"JWT\"}");
        String claims = encoded("{\"iss\":\"issuer\",\"aud\":\"audience\",\"sub\":\"" + UUID.randomUUID()
                + "\",\"sid\":\"" + UUID.randomUUID() + "\",\"roles\":[\"SELLER\"],\"nbf\":"
                + now.plusSeconds(60).getEpochSecond() + ",\"exp\":" + now.plusSeconds(600).getEpochSecond() + "}");
        String signed = header + "." + claims;
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(key);
        signature.update(signed.getBytes(StandardCharsets.US_ASCII));
        return signed + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(signature.sign());
    }

    private static String encoded(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private record TestAuthenticator(InboundJwtAuthenticator authenticator, Rs256AccessTokenAdapter tokens) { }
}
