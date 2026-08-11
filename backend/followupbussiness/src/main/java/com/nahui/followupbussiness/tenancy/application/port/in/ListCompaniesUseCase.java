package com.nahui.followupbussiness.tenancy.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.util.List;

public interface ListCompaniesUseCase {
    Result execute(Query query, AuthenticatedActor actor);

    record Query(int page, int pageSize, String search, CompanyStatus status) { }
    record Result(List<Company> items, long totalElements) { }
}
