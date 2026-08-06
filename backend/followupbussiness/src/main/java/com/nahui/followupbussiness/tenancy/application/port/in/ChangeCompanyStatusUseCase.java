package com.nahui.followupbussiness.tenancy.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.tenancy.application.ChangeCompanyStatusCommand;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import java.util.UUID;

public interface ChangeCompanyStatusUseCase {
    Result execute(UUID companyId, ChangeCompanyStatusCommand command, AuthenticatedActor actor);

    record Result(Company company, boolean found, boolean denied) {
        public static Result success(Company company) { return new Result(company, true, false); }
        public static Result notFound() { return new Result(null, false, false); }
        public static Result deniedResult() { return new Result(null, true, true); }
    }
}
