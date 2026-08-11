package com.nahui.followupbussiness.identityaccess.application.port.out;

import com.nahui.followupbussiness.identityaccess.application.CompanyAdminInvitation;
import java.util.List;
import java.util.UUID;

public interface CompanyAdminInvitationQuery {
    List<CompanyAdminInvitation> listByCompany(UUID companyId);
}
