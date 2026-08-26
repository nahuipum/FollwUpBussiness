package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.routing.domain.Route;

import java.util.UUID;

public interface PublishRouteUseCase {
    Route publish(Command command, AuthenticatedActor actor);

    record Command(UUID routeId, long expectedVersion, UUID idempotencyKey, boolean notifySeller, UUID correlationId) { }

    final class Forbidden extends RuntimeException { }
    final class Conflict extends RuntimeException { }
    final class Invalid extends RuntimeException { }
    final class Unavailable extends RuntimeException { }
}
