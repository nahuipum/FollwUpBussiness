package com.nahui.followupbussiness.identityaccess.application;

import java.time.Instant;
import java.util.UUID;

public record ProvisionInitialCompanyAdminResult(UUID id, String displayName, String username, String email, Instant createdAt, Instant updatedAt) { }
