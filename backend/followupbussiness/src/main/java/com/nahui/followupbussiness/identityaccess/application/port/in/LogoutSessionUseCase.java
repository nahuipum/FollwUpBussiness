package com.nahui.followupbussiness.identityaccess.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;

import java.util.UUID;

public interface LogoutSessionUseCase {
    void logout(Command command);

    record Command(AuthenticatedActor actor, boolean allSessions, String csrfToken, String revocationTicket,
                   String webRefreshCookie, UUID correlationId) {
    }
}
