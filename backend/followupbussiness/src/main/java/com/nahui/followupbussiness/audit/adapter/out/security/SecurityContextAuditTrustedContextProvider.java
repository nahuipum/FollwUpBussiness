package com.nahui.followupbussiness.audit.adapter.out.security;

import com.nahui.followupbussiness.audit.application.AuditTrustedContext;
import com.nahui.followupbussiness.audit.application.port.out.AuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.domain.AuditScope;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityContextAuditTrustedContextProvider implements AuditTrustedContextProvider {
    private static final String CORRELATION_ID_ATTRIBUTE = "com.nahui.followupbussiness.request.correlationId";
    @Override
    public AuditTrustedContext current() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedActor actor) || actor.tenantId() == null) {
            throw new SecurityException("A tenant-scoped authenticated actor is required for audit recording");
        }
        return new AuditTrustedContext(actor.tenantId(), actor.accountId(), correlationId(authentication), AuditScope.AUTHORIZED_RESOURCE);
    }

    private static UUID correlationId(Authentication authentication) {
        if (authentication.getDetails() instanceof UUID correlation) return correlation;
        try {
            var attributes = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes instanceof org.springframework.web.context.request.ServletRequestAttributes servlet) {
                Object correlation = servlet.getRequest().getAttribute(CORRELATION_ID_ATTRIBUTE);
                if (correlation instanceof UUID value) return value;
                return correlationId(servlet.getRequest().getHeader("X-Correlation-Id"));
            }
        } catch (Exception ignored) { }
        return UUID.randomUUID();
    }

    private static UUID correlationId(String supplied) {
        try {
            return UUID.fromString(supplied);
        } catch (Exception ignored) {
            return UUID.randomUUID();
        }
    }
}
