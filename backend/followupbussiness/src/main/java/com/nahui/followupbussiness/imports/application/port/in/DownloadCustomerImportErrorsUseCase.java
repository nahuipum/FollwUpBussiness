package com.nahui.followupbussiness.imports.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import java.util.UUID;

public interface DownloadCustomerImportErrorsUseCase {
    ErrorFile download(UUID importId, AuthenticatedActor actor);

    record ErrorFile(String filename, byte[] content) { }
    final class Forbidden extends RuntimeException { }
    final class NotFound extends RuntimeException { }
    final class Expired extends RuntimeException { }
}
