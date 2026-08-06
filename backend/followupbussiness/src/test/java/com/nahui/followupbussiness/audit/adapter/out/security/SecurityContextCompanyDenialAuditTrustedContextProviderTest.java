package com.nahui.followupbussiness.audit.adapter.out.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.time.Clock;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class SecurityContextCompanyDenialAuditTrustedContextProviderTest {
    private final SecurityContextCompanyDenialAuditTrustedContextProvider provider = new SecurityContextCompanyDenialAuditTrustedContextProvider(Clock.systemUTC());
    @AfterEach void clear() { SecurityContextHolder.clearContext(); RequestContextHolder.resetRequestAttributes(); }
    @Test void derivesTheRealTenantAndNormalizedCorrelationFromServerContext() {
        UUID tenant = UUID.randomUUID(); UUID actor = UUID.randomUUID(); UUID correlation = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest(); request.setAttribute("com.nahui.followupbussiness.request.correlationId", correlation);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthenticatedActor(actor, tenant, BaseRole.PLATFORM_SUPERADMIN), "token", java.util.List.of()));
        var context = provider.current();
        assertThat(context.tenantId()).isEqualTo(tenant); assertThat(context.actorId()).isEqualTo(actor); assertThat(context.correlationId()).isEqualTo(correlation);
    }
    @Test void rejectsPlatformWithoutTenantAndNonPlatformActors() {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN), "token", java.util.List.of()));
        assertThatThrownBy(provider::current).isInstanceOf(SecurityException.class);
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), "token", java.util.List.of()));
        assertThatThrownBy(provider::current).isInstanceOf(SecurityException.class);
    }
}
