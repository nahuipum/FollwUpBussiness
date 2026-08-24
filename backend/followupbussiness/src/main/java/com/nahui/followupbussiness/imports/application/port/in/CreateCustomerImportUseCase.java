package com.nahui.followupbussiness.imports.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.imports.domain.CustomerImport;

import java.util.UUID;

public interface CreateCustomerImportUseCase {
    CustomerImport create(Command command, AuthenticatedActor actor, UUID correlationId);

    record Command(String idempotencyKey, String fileName, String contentType, String templateVersion,
                   boolean partialAcceptance, byte[] contents) {
    }

    final class Forbidden extends RuntimeException {
    }

    final class PayloadTooLarge extends RuntimeException {
    }

    final class Invalid extends RuntimeException {
        public Invalid(String message) {
            super(message);
        }
    }

    final class Conflict extends RuntimeException {
    }
}
