package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.application.port.in.ListCompanyAdminInvitationsUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.out.CompanyAdminInvitationQuery;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.util.List;
import java.util.UUID;

public final class ListCompanyAdminInvitationsService implements ListCompanyAdminInvitationsUseCase {
    private final CompanyAdminInvitationQuery invitations;

    public ListCompanyAdminInvitationsService(CompanyAdminInvitationQuery invitations) {
        this.invitations = invitations;
    }

    @Override
    public List<CompanyAdminInvitation> execute(UUID companyId, AuthenticatedActor actor) {
        if (companyId == null || actor == null || actor.role() != BaseRole.PLATFORM_SUPERADMIN || actor.tenantId() != null) {
            throw new Forbidden();
        }
        return invitations.listByCompany(companyId);
    }

    public static final class Forbidden extends RuntimeException { }
}
