package com.nahui.followupbussiness.tenancy.application.port.out;

import com.nahui.followupbussiness.tenancy.domain.model.Company;

public interface CompanyCreationStore { boolean create(Company company); }
