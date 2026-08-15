package com.nahui.followupbussiness.tenancy.application.port.out;

import com.nahui.followupbussiness.tenancy.application.port.in.ListCompaniesUseCase;
import com.nahui.followupbussiness.tenancy.domain.model.Company;

import java.util.List;

public interface CompanyListStore {
    List<Company> find(ListCompaniesUseCase.Query query);

    long count(ListCompaniesUseCase.Query query);
}
