package com.nahui.followupbussiness.identityaccess.application.port.in;

import com.nahui.followupbussiness.identityaccess.application.ProvisionInitialCompanyAdminCommand;
import com.nahui.followupbussiness.identityaccess.application.ProvisionInitialCompanyAdminResult;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;

public interface ProvisionInitialCompanyAdminUseCase {
    ProvisionInitialCompanyAdminResult execute(ProvisionInitialCompanyAdminCommand command, AuthenticatedActor actor);
}
