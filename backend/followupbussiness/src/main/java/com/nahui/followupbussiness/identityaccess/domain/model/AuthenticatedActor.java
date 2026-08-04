package com.nahui.followupbussiness.identityaccess.domain.model;

import java.security.Principal;
import java.util.UUID;

/** Server-validated identity; a company id is never accepted from a request body. */
public record AuthenticatedActor(UUID accountId, UUID tenantId, BaseRole role) implements Principal {
    @Override
    public String getName() {
        return accountId.toString();
    }
}
