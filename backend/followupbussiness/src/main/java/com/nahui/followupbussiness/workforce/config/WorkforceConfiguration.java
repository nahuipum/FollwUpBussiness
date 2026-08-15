package com.nahui.followupbussiness.workforce.config;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.workforce.adapter.out.persistence.JdbcTerritoryStore;
import com.nahui.followupbussiness.workforce.application.TerritoryService;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class WorkforceConfiguration {
    @Bean
    TerritoryService territoryService(JdbcTemplate jdbc, RecordAuditEntryUseCase audit) {
        return new TerritoryService(new JdbcTerritoryStore(jdbc), audit, Clock.systemUTC());
    }
}
