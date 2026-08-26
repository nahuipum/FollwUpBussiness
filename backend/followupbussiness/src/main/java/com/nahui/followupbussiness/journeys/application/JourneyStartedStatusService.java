package com.nahui.followupbussiness.journeys.application;

import com.nahui.followupbussiness.journeys.application.port.in.JourneyStartedStatusUseCase;
import com.nahui.followupbussiness.journeys.application.port.out.JourneyStartGuardStore;
import org.springframework.dao.DataAccessException;

public final class JourneyStartedStatusService implements JourneyStartedStatusUseCase {
    private final JourneyStartGuardStore guards;

    public JourneyStartedStatusService(JourneyStartGuardStore guards) {
        this.guards = guards;
    }

    @Override
    public State stateForUpdate(Query query) {
        try {
            return guards.stateForUpdate(query);
        } catch (DataAccessException exception) {
            throw new Unavailable("journey start guard is unavailable");
        }
    }
}
