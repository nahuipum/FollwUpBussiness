package com.nahui.followupbussiness.journeys.application.port.out;

import com.nahui.followupbussiness.journeys.application.port.in.JourneyStartedStatusUseCase;
import java.time.Instant;

/**
 * Durable, transaction-bound guard for one tenant, seller and business date.
 *
 * <p>BE-028 must call {@link #markStarted(JourneyStartedStatusUseCase.Query, Instant)} in the
 * same transaction that starts the journey, after acquiring the guard through
 * {@link #stateForUpdate(JourneyStartedStatusUseCase.Query)}.</p>
 */
public interface JourneyStartGuardStore {
    JourneyStartedStatusUseCase.State stateForUpdate(JourneyStartedStatusUseCase.Query query);

    void markStarted(JourneyStartedStatusUseCase.Query query, Instant startedAt);
}
