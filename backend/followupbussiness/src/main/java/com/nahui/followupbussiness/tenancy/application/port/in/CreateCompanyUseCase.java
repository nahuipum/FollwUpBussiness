package com.nahui.followupbussiness.tenancy.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.tenancy.application.CreateCompanyCommand;
import com.nahui.followupbussiness.tenancy.domain.model.Company;

public interface CreateCompanyUseCase {
    Result execute(CreateCompanyCommand command, AuthenticatedActor actor);
    record Result(Company company, boolean conflict, boolean denied) {
        public static Result created(Company company) { return new Result(company, false, false); }
        public static Result conflictResult() { return new Result(null, true, false); }
        public static Result deniedResult() { return new Result(null, false, true); }
    }
}
