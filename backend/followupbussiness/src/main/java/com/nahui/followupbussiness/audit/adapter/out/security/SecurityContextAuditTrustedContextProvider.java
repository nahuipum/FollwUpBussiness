package com.nahui.followupbussiness.audit.adapter.out.security;

import com.nahui.followupbussiness.audit.application.AuditTrustedContext;
import com.nahui.followupbussiness.audit.application.port.out.AuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.domain.AuditScope;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityContextAuditTrustedContextProvider implements AuditTrustedContextProvider {
    @Override public AuditTrustedContext current() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedActor actor) || actor.tenantId() == null) {
            throw new SecurityException("A tenant-scoped authenticated actor is required for audit recording");
        }
        return new AuditTrustedContext(actor.tenantId(), actor.accountId(), UUID.randomUUID(), AuditScope.AUTHORIZED_RESOURCE);
    }
}
