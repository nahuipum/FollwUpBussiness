package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.routing.domain.Route;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CopyRouteUseCase {
    Result copy(Command command, AuthenticatedActor actor);

    record Command(UUID sourceRouteId, LocalDate date, UUID sellerId, String name, UUID idempotencyKey) { }
    record Result(Route route, List<Warning> warnings) { }
    record Warning(String code, String resourceType, UUID sourcePointId) { }
    final class Forbidden extends RuntimeException { }
    final class Conflict extends RuntimeException { }
    final class Invalid extends RuntimeException { }
}
