package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.domain.AuditScope;
import java.util.UUID;

public record AuditTrustedContext(UUID tenantId, UUID actorId, UUID correlationId, AuditScope scope) { }
