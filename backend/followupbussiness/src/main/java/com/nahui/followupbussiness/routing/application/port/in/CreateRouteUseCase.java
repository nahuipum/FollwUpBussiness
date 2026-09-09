package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.routing.domain.Route;

import java.time.LocalDate;

import java.util.List;
import java.util.UUID;

public interface CreateRouteUseCase {
    Route create(Command command, AuthenticatedActor actor);

    record Command(String name, LocalDate date, UUID sellerId, List<Visit> visits,
                   UUID idempotencyKey) {
    }
    record Visit(UUID customerId, int serviceDurationSeconds) { }

    final class Forbidden extends RuntimeException {
    }

    final class Conflict extends RuntimeException {
    }

    final class Invalid extends RuntimeException {
    }
}
