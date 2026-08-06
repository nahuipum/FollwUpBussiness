package com.nahui.followupbussiness.audit.adapter.out.security;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.time.Clock;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class SecurityContextPlatformAuditTrustedContextProviderTest {
    private final SecurityContextPlatformAuditTrustedContextProvider provider = new SecurityContextPlatformAuditTrustedContextProvider(Clock.systemUTC());
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @Test void rejectsTenantBoundOrNonPlatformActors() {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN), "token", java.util.List.of()));
        assertThatThrownBy(provider::current).isInstanceOf(SecurityException.class);
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.COMPANY_ADMIN), "token", java.util.List.of()));
        assertThatThrownBy(provider::current).isInstanceOf(SecurityException.class);
    }
}
