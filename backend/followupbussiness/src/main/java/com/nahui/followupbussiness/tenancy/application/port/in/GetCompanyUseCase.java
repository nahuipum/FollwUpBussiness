package com.nahui.followupbussiness.tenancy.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import java.util.Optional;
import java.util.UUID;

public interface GetCompanyUseCase {
    Optional<Company> execute(UUID companyId, AuthenticatedActor actor);
}
