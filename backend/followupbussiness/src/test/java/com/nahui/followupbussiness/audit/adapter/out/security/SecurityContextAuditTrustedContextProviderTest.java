package com.nahui.followupbussiness.audit.adapter.out.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class SecurityContextAuditTrustedContextProviderTest {
    private final SecurityContextAuditTrustedContextProvider provider = new SecurityContextAuditTrustedContextProvider();

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void usesTheRequestCorrelationWithTheAuthenticatedTenantActor() {
        UUID tenant = UUID.randomUUID(), actor = UUID.randomUUID(), correlation = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("com.nahui.followupbussiness.request.correlationId", correlation);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                new AuthenticatedActor(actor, tenant, BaseRole.COMPANY_ADMIN), "token", java.util.List.of()));

        var context = provider.current();

        assertThat(context.tenantId()).isEqualTo(tenant);
        assertThat(context.actorId()).isEqualTo(actor);
        assertThat(context.correlationId()).isEqualTo(correlation);
    }

    @Test
    void usesThePersistedJobCorrelationAttachedToTheAsyncAuthentication() {
        UUID tenant = UUID.randomUUID(), actor = UUID.randomUUID(), correlation = UUID.randomUUID();
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                new AuthenticatedActor(actor, tenant, BaseRole.COMPANY_ADMIN), "internal-import-worker", java.util.List.of());
        authentication.setDetails(correlation);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        var context = provider.current();

        assertThat(context.tenantId()).isEqualTo(tenant);
        assertThat(context.actorId()).isEqualTo(actor);
        assertThat(context.correlationId()).isEqualTo(correlation);
    }
}
