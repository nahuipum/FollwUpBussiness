package com.nahui.followupbussiness.notifications.application.port.in;

import java.util.UUID;

/** Public technical boundary for session-driven push installation revocation. */
public interface RevokeInstallationsForSession { void revoke(UUID sessionFamilyId, UUID tenantId); }
