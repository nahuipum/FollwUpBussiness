package com.nahui.followupbussiness.journeys.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nahui.followupbussiness.journeys.application.port.in.JourneyStartedStatusUseCase;
import com.nahui.followupbussiness.journeys.application.port.out.JourneyStartGuardStore;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;

class JourneyStartedStatusServiceTest {
    @Test
    void translatesPersistenceFailureToUnavailableInsteadOfNotStarted() {
        JourneyStartGuardStore store = mock(JourneyStartGuardStore.class);
        JourneyStartedStatusUseCase.Query query = new JourneyStartedStatusUseCase.Query(UUID.randomUUID(), UUID.randomUUID(), LocalDate.now());
        when(store.stateForUpdate(query)).thenThrow(new DataAccessResourceFailureException("down"));

        assertThatThrownBy(() -> new JourneyStartedStatusService(store).stateForUpdate(query))
                .isInstanceOf(JourneyStartedStatusUseCase.Unavailable.class);
    }
}
