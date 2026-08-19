package com.nahui.followupbussiness.workforce.config;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.workforce.adapter.out.persistence.JdbcTerritoryStore;
import com.nahui.followupbussiness.workforce.adapter.out.persistence.JdbcSellerStore;
import com.nahui.followupbussiness.workforce.application.SellerService;
import com.nahui.followupbussiness.workforce.application.TerritoryService;
import com.nahui.followupbussiness.workforce.application.TerritoryReferenceService;
import com.nahui.followupbussiness.workforce.application.PortfolioAccessScopeService;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.TerritoryReferenceUseCase;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class WorkforceConfiguration {
    @Bean
    TerritoryService territoryService(JdbcTemplate jdbc, RecordAuditEntryUseCase audit) {
        return new TerritoryService(new JdbcTerritoryStore(jdbc), audit, Clock.systemUTC());
    }

    @Bean
    TerritoryReferenceUseCase territoryReferenceUseCase(JdbcTemplate jdbc) {
        return new TerritoryReferenceService(new JdbcTerritoryStore(jdbc));
    }

    @Bean
    PortfolioAccessScopeUseCase portfolioAccessScopeUseCase(JdbcTemplate jdbc) {
        return new PortfolioAccessScopeService(new JdbcSellerStore(jdbc));
    }

    @Bean
    SellerService sellerService(JdbcTemplate jdbc, CompanyUserService users,
                                @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit) {
        return new SellerService(new JdbcSellerStore(jdbc), users, audit, Clock.systemUTC());
    }
}
