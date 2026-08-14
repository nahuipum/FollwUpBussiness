package com.nahui.followupbussiness.tenancy.application.port.out;

import com.nahui.followupbussiness.tenancy.domain.model.Company;
import java.util.Optional;
import java.util.UUID;

public interface CompanyDetailStore {
    Optional<Company> findById(UUID companyId);
}
