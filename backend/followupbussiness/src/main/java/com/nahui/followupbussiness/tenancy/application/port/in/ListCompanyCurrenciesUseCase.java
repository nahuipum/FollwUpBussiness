package com.nahui.followupbussiness.tenancy.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;

import java.util.List;

public interface ListCompanyCurrenciesUseCase {
    List<Currency> execute(AuthenticatedActor actor);

    record Currency(String code, String displayName) {
    }
}
