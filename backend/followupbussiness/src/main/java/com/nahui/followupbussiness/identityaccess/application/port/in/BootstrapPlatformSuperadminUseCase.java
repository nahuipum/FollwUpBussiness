package com.nahui.followupbussiness.identityaccess.application.port.in;

import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminCommand;
import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminResult;

@FunctionalInterface
public interface BootstrapPlatformSuperadminUseCase {

    BootstrapPlatformSuperadminResult execute(BootstrapPlatformSuperadminCommand command);
}
