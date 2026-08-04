package com.nahui.followupbussiness.identityaccess.adapter.out.security;

import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class Rs256AccessTokenAdapterTest {
    @Test
    void issuesVerifiableRs256JwtWithServerDerivedTenantAndRoleClaims() throws Exception {
        var keys = KeyPairGenerator.getInstance("RSA");
        keys.initialize(2048);
        var pair = keys.generateKeyPair();
        var subject = UUID.randomUUID();
        var session = UUID.randomUUID();
        var tenant = UUID.randomUUID();
        var token = new Rs256AccessTokenAdapter(pair.getPrivate(), "test-kid", "followupbussiness", "web", Clock.fixed(Instant.ofEpochSecond(100), ZoneOffset.UTC))
                .issue(subject, session, tenant, BaseRole.SELLER);
        var parts = token.split("\\.");
        var verifier = Signature.getInstance("SHA256withRSA");
        verifier.initVerify(pair.getPublic());
        verifier.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));

        assertThat(parts).hasSize(3);
        assertThat(verifier.verify(Base64.getUrlDecoder().decode(parts[2]))).isTrue();
        assertThat(new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8))
                .contains("\"sub\":\"" + subject + "\"", "\"sid\":\"" + session + "\"", "\"tid\":\"" + tenant + "\"", "SELLER");
    }
}
