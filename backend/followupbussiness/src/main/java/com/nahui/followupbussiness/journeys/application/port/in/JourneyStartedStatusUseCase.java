package com.nahui.followupbussiness.journeys.application.port.in;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Public {@code journeys} boundary for making an operation conditional on a seller not having
 * started the workday. Implementations acquire the same tenant/seller/business-date guard used
 * by the journey-start transition and retain it until the caller transaction completes.
 *
 * <p>{@link State#NOT_STARTED} means no journey for the exact triple has started successfully.
 * {@link State#STARTED} remains true after that journey is closed. A lookup or guard failure must
 * be reported as {@link Unavailable}; it must never be represented as {@code NOT_STARTED}.</p>
 */
public interface JourneyStartedStatusUseCase {
    State stateForUpdate(Query query);

    record Query(UUID tenantId, UUID sellerId, LocalDate businessDate) {
        public Query {
            if (tenantId == null || sellerId == null || businessDate == null) {
                throw new IllegalArgumentException("tenantId, sellerId and businessDate are required");
            }
        }
    }

    enum State { NOT_STARTED, STARTED }

    final class Unavailable extends RuntimeException {
        public Unavailable() { }
        public Unavailable(String message) { super(message); }
    }
}
