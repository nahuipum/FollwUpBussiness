package com.nahui.followupbussiness.identityaccess.application;

import java.util.UUID;

public record ProvisionInitialCompanyAdminCommand(UUID companyId, String displayName, String username, String email) { }
