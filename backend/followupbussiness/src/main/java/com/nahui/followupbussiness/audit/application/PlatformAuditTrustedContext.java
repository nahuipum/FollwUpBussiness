package com.nahui.followupbussiness.audit.application;

import java.time.Instant;
import java.util.UUID;

/** Trusted, server-derived context for a platform-only critical audit operation. */
public record PlatformAuditTrustedContext(UUID actorId, UUID correlationId, Instant occurredAt) { }
