package com.nahui.followupbussiness.customers.config;

import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuditEntryStore;
import com.nahui.followupbussiness.audit.application.RecordAuditEntry;
import com.nahui.followupbussiness.audit.application.port.out.AuditTrustedContextProvider;
import com.nahui.followupbussiness.customers.adapter.out.persistence.JdbcCustomerStore;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration(proxyBeanMethods = false)
public class CustomerConfiguration {
    @Bean CreateCustomerService createCustomerService(JdbcTemplate jdbc, AuditTrustedContextProvider contextProvider) {
        var audit = new RecordAuditEntry(new JdbcAuditEntryStore(jdbc, jdbc), contextProvider, Clock.systemUTC());
        return new CreateCustomerService(new JdbcCustomerStore(jdbc), audit, Clock.systemUTC());
    }
}
