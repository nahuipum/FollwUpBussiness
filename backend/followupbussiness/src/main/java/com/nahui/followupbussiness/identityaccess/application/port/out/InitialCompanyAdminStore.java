package com.nahui.followupbussiness.identityaccess.application.port.out;

import com.nahui.followupbussiness.identityaccess.application.ProvisionInitialCompanyAdminResult;
import java.util.UUID;

public interface InitialCompanyAdminStore {
    boolean create(UUID id, UUID companyId, String loginIdentifier, String passwordHash, String displayName, String email);
    ProvisionInitialCompanyAdminResult created(UUID id);
}
