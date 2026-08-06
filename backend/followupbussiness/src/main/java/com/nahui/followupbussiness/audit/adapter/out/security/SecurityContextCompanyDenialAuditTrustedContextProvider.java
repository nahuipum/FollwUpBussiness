package com.nahui.followupbussiness.audit.adapter.out.security;

import com.nahui.followupbussiness.audit.application.CompanyDenialAuditTrustedContext;
import com.nahui.followupbussiness.audit.application.port.out.CompanyDenialAuditTrustedContextProvider;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.time.Clock;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityContextCompanyDenialAuditTrustedContextProvider implements CompanyDenialAuditTrustedContextProvider {
    private static final String CORRELATION_ID_ATTRIBUTE = "com.nahui.followupbussiness.request.correlationId";
    private final Clock clock;
    public SecurityContextCompanyDenialAuditTrustedContextProvider(Clock clock) { this.clock = clock; }
    @Override public CompanyDenialAuditTrustedContext current() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof AuthenticatedActor actor)
                || actor.role() != BaseRole.PLATFORM_SUPERADMIN || actor.tenantId() == null)
            throw new SecurityException("A tenant-bound platform superadmin is required for company denial audit recording");
        return new CompanyDenialAuditTrustedContext(actor.tenantId(), actor.accountId(), correlationId(), clock.instant());
    }
    private static UUID correlationId() {
        try {
            var attributes = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes instanceof org.springframework.web.context.request.ServletRequestAttributes servlet) {
                Object correlation = servlet.getRequest().getAttribute(CORRELATION_ID_ATTRIBUTE);
                if (correlation instanceof UUID value) return value;
                return correlationId(servlet.getRequest().getHeader("X-Correlation-Id"));
            }
            return UUID.randomUUID();
        } catch (Exception ignored) { return UUID.randomUUID(); }
    }
    private static UUID correlationId(String supplied) { try { return UUID.fromString(supplied); } catch (Exception ignored) { return UUID.randomUUID(); } }
}
