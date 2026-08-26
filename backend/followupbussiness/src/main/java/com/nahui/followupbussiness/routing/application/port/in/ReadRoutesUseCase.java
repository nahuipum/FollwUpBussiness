package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.routing.domain.Route;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReadRoutesUseCase {
    Page list(ListQuery query, AuthenticatedActor actor);
    Route get(UUID routeId, AuthenticatedActor actor);
    Route myRoute(LocalDate date, AuthenticatedActor actor);

    record ListQuery(LocalDate date, UUID sellerId, String status, int page, int pageSize) { }
    record Page(List<Route> items, long total) { }
    final class NotFound extends RuntimeException { }
    final class Forbidden extends RuntimeException { }
    final class Conflict extends RuntimeException { }
    final class Invalid extends RuntimeException { }
}
