package com.nahui.followupbussiness.audit.config;

import com.nahui.followupbussiness.audit.adapter.in.scheduling.AuditRetentionScheduler;
import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuditEntryStore;
import com.nahui.followupbussiness.audit.application.PurgeAuditRetention;
import com.nahui.followupbussiness.audit.application.RecordAuditEntry;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.application.port.out.AuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextAuditTrustedContextProvider;
import io.micrometer.core.instrument.MeterRegistry;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
public class AuditConfiguration {
    @Bean
    @ConfigurationProperties(prefix = "followupbussiness.audit.database")
    AuditDatabaseProperties auditDatabaseProperties() { return new AuditDatabaseProperties(); }

    @Bean
    AuditEntryStore auditEntryStore(AuditDatabaseProperties properties) {
        properties.validate();
        return new JdbcAuditEntryStore(new JdbcTemplate(new DriverManagerDataSource(properties.getWriterUrl(), properties.getWriterUsername(), properties.getWriterPassword())),
                new JdbcTemplate(new DriverManagerDataSource(properties.getPurgerUrl(), properties.getPurgerUsername(), properties.getPurgerPassword())));
    }

    @Bean
    AuditTrustedContextProvider auditTrustedContextProvider() { return new SecurityContextAuditTrustedContextProvider(); }

    @Bean
    RecordAuditEntryUseCase recordAuditEntryUseCase(AuditEntryStore store, AuditTrustedContextProvider contextProvider) {
        return new RecordAuditEntry(store, contextProvider, Clock.systemUTC());
    }

    @Bean
    PurgeAuditRetention purgeAuditRetention(AuditEntryStore store) {
        return new PurgeAuditRetention(store, Clock.systemUTC());
    }

    @Bean
    AuditRetentionScheduler auditRetentionScheduler(PurgeAuditRetention retention, MeterRegistry meters) {
        return new AuditRetentionScheduler(retention, meters.counter("audit.entries.retention_deleted"), meters.counter("audit.network_context.retention_deleted"));
    }
}
