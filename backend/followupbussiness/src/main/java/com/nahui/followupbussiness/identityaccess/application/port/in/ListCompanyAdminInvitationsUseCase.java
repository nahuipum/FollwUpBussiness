package com.nahui.followupbussiness.identityaccess.application.port.in;

import com.nahui.followupbussiness.identityaccess.application.CompanyAdminInvitation;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import java.util.List;
import java.util.UUID;

public interface ListCompanyAdminInvitationsUseCase {
    List<CompanyAdminInvitation> execute(UUID companyId, AuthenticatedActor actor);
}
