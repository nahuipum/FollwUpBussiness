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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class InboundJwtAuthenticatorTest {
    @Test
    void acceptsOnlySignedPlatformTokenWhoseSessionAndPersistedRoleAreActive() throws Exception {
        var keys = KeyPairGenerator.getInstance("RSA"); keys.initialize(2048); var pair = keys.generateKeyPair();
        Instant now = Instant.parse("2026-08-04T12:00:00Z"); UUID subject = UUID.randomUUID(); UUID session = UUID.randomUUID();
        String token = new Rs256AccessTokenAdapter(pair.getPrivate(), "kid", "issuer", "audience", Clock.fixed(now, ZoneOffset.UTC))
                .issue(subject, session, null, BaseRole.PLATFORM_SUPERADMIN);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForObject(any(String.class), eq(Integer.class), any(), any(), any(), any())).thenReturn(1);
        var authenticator = new InboundJwtAuthenticator(pair.getPublic(), "issuer", "audience", jdbc, Clock.fixed(now, ZoneOffset.UTC));

        var authentication = authenticator.authenticate(token);

        assertThat(authentication.getName()).isEqualTo(subject.toString());
        assertThat(authentication.getAuthorities()).extracting("authority").containsExactly("PLATFORM_SUPERADMIN");
        assertThatThrownBy(() -> authenticator.authenticate(token.substring(0, token.length() - 2) + "aa"))
                .isInstanceOf(InboundJwtAuthenticator.JwtValidationException.class);
    }

    @Test
    void rejectsSignedTenantRoleAndInactiveSessionClaimsForPlatformOperation() throws Exception {
        var keys = KeyPairGenerator.getInstance("RSA"); keys.initialize(2048); var pair = keys.generateKeyPair();
        Instant now = Instant.parse("2026-08-04T12:00:00Z");
        String token = new Rs256AccessTokenAdapter(pair.getPrivate(), "kid", "issuer", "audience", Clock.fixed(now, ZoneOffset.UTC))
                .issue(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN);
        var authenticator = new InboundJwtAuthenticator(pair.getPublic(), "issuer", "audience", mock(JdbcTemplate.class), Clock.fixed(now, ZoneOffset.UTC));

        assertThatThrownBy(() -> authenticator.authenticate(token)).isInstanceOf(InboundJwtAuthenticator.JwtValidationException.class);
    }
}
