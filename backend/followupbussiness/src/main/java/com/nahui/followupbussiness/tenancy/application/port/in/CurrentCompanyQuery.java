package com.nahui.followupbussiness.tenancy.application.port.in;

import com.nahui.followupbussiness.tenancy.domain.model.Company;
import java.util.Optional;
import java.util.UUID;

/** Public cross-module query for the authenticated tenant's contractual company projection. */
public interface CurrentCompanyQuery {
    Optional<Company> findById(UUID companyId);
}
