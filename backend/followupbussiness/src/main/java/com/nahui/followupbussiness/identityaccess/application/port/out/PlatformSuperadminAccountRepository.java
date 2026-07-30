package com.nahui.followupbussiness.identityaccess.application.port.out;

import com.nahui.followupbussiness.identityaccess.domain.model.LoginIdentifier;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.identityaccess.domain.model.PlatformSuperadminAccount;

import java.util.UUID;
import java.util.Optional;

public interface PlatformSuperadminAccountRepository {

    Optional<ExistingAccount> findAnyByLoginIdentifier(LoginIdentifier loginIdentifier);

    Optional<ExistingAccount> findPlatformSuperadmin();

    boolean insertIfAbsent(PlatformSuperadminAccount account);

    record ExistingAccount(UUID id, BaseRole role, UUID companyId) {
    }
}
