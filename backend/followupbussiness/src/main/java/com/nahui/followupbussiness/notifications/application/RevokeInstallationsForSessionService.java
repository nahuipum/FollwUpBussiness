package com.nahui.followupbussiness.notifications.application;

import com.nahui.followupbussiness.notifications.application.port.in.RevokeInstallationsForSession;
import java.util.UUID;

public final class RevokeInstallationsForSessionService implements RevokeInstallationsForSession {
    private final RevokeInstallationsForSession store;
    public RevokeInstallationsForSessionService(RevokeInstallationsForSession store) { this.store=store; }
    public void revoke(UUID family, UUID tenant) { if(family==null) throw new IllegalArgumentException("session family is required"); store.revoke(family,tenant); }
}
