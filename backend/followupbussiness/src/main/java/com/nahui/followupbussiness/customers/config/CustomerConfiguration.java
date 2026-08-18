package com.nahui.followupbussiness.customers.config;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerStore;
import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerPortfolioStore;
import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerActivityStore;
import com.nahui.followupbussiness.customers.application.CustomerPortfolioReadService;
import com.nahui.followupbussiness.customers.application.CustomerPortfolioAssignmentService;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioAssignmentUseCase;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.customers.application.UpdateCustomerService;
import com.nahui.followupbussiness.customers.application.CheckCustomerDuplicatesService;
import com.nahui.followupbussiness.workforce.application.port.in.TerritoryReferenceUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import com.nahui.followupbussiness.workforce.config.SellerReferenceConfiguration;

import java.time.Clock;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration(proxyBeanMethods = false)
@Import(SellerReferenceConfiguration.class)
public class CustomerConfiguration {
    @Bean
    CreateCustomerService createCustomerService(JdbcTemplate jdbc, TerritoryReferenceUseCase territories, @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit) {
        return new CreateCustomerService(new JdbcCustomerStore(jdbc), territories, audit, Clock.systemUTC());
    }

    @Bean
    UpdateCustomerService updateCustomerService(JdbcTemplate jdbc, TerritoryReferenceUseCase territories, @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit) {
        return new UpdateCustomerService(new JdbcCustomerStore(jdbc), territories, audit, Clock.systemUTC());
    }

    @Bean
    CheckCustomerDuplicatesService checkCustomerDuplicatesService(JdbcTemplate jdbc) {
        return new CheckCustomerDuplicatesService(new JdbcCustomerStore(jdbc));
    }

    @Bean
    CustomerPortfolioReadUseCase customerPortfolioReadUseCase(JdbcTemplate jdbc) {
        return new CustomerPortfolioReadService(new JdbcCustomerPortfolioStore(jdbc), new JdbcCustomerActivityStore(jdbc));
    }
    @Bean
    CustomerPortfolioAssignmentUseCase customerPortfolioAssignmentUseCase(JdbcTemplate jdbc, SellerReferenceUseCase sellers, @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit) {
        return new CustomerPortfolioAssignmentService(new JdbcCustomerStore(jdbc), new JdbcCustomerPortfolioStore(jdbc), sellers, audit, Clock.systemUTC());
    }
}
