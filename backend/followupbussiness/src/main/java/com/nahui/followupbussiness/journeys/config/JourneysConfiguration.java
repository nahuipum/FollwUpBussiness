package com.nahui.followupbussiness.journeys.config;

import com.nahui.followupbussiness.journeys.adapter.out.persistence.JdbcJourneyStartGuardStore;
import com.nahui.followupbussiness.journeys.application.JourneyStartedStatusService;
import com.nahui.followupbussiness.journeys.application.port.in.JourneyStartedStatusUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration(proxyBeanMethods = false)
public class JourneysConfiguration {
    @Bean
    JourneyStartedStatusUseCase journeyStartedStatusUseCase(JdbcTemplate jdbc) {
        return new JourneyStartedStatusService(new JdbcJourneyStartGuardStore(jdbc));
    }
}
