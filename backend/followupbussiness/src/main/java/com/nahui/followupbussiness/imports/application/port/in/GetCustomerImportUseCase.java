package com.nahui.followupbussiness.imports.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import java.util.Optional;
import java.util.UUID;

public interface GetCustomerImportUseCase {
    Optional<CustomerImport> get(UUID importId, AuthenticatedActor actor);
    final class Forbidden extends RuntimeException { }
}
