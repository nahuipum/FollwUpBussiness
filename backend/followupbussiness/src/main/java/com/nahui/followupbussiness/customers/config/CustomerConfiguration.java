package com.nahui.followupbussiness.customers.config;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerStore;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import java.time.Clock;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration(proxyBeanMethods = false)
public class CustomerConfiguration {
    @Bean CreateCustomerService createCustomerService(JdbcTemplate jdbc, @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit) {
        return new CreateCustomerService(new JdbcCustomerStore(jdbc), audit, Clock.systemUTC());
    }
}
