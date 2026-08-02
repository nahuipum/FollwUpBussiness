package com.nahui.followupbussiness.identityaccess.application.port.out;

import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.util.Optional;
import java.util.UUID;

public interface LoginAccountQuery {
    Optional<Account> findByIdentifier(String identifier);
    record Account(UUID id, String passwordHash, BaseRole role, UUID companyId, String status, String displayName, String email) { }
}
