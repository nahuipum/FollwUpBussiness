package com.nahui.followupbussiness.audit.application;

import java.time.Instant;
import java.util.UUID;

/** Server-derived identity for a tenant-bound company-creation denial. */
public record CompanyDenialAuditTrustedContext(UUID tenantId, UUID actorId, UUID correlationId, Instant occurredAt) { }
