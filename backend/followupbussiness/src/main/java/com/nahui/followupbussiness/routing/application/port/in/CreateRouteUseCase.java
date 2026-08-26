package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.routing.domain.Route;

import java.time.LocalDate;

import com.nahui.followupbussiness.customers.domain.GeoPoint;

import java.util.List;
import java.util.UUID;

public interface CreateRouteUseCase {
    Route create(Command command, AuthenticatedActor actor);

    record Command(String name, LocalDate date, UUID sellerId, GeoPoint startLocation, List<UUID> customerIds,
                   UUID idempotencyKey) {
    }

    final class Forbidden extends RuntimeException {
    }

    final class Conflict extends RuntimeException {
    }

    final class Invalid extends RuntimeException {
    }
}
