package com.nahui.followupbussiness.audit.config;

import com.nahui.followupbussiness.audit.adapter.in.scheduling.AuditRetentionScheduler;
import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuditEntryStore;
import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuthenticationAuditAdapter;
import com.nahui.followupbussiness.audit.application.PurgeAuditRetention;
import com.nahui.followupbussiness.audit.application.RecordAuditEntry;
import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAudit;
import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAudit;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuthenticationAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.application.port.out.AuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextAuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextPlatformAuditTrustedContextProvider;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextCompanyDenialAuditTrustedContextProvider;
import io.micrometer.core.instrument.MeterRegistry;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import javax.sql.DataSource;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
@ConditionalOnBean(DataSource.class)
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
    RecordPlatformCompanyAuditUseCase recordPlatformCompanyAuditUseCase(JdbcTemplate jdbcTemplate) {
        return new RecordPlatformCompanyAudit(new JdbcAuditEntryStore(jdbcTemplate, jdbcTemplate),
                new SecurityContextPlatformAuditTrustedContextProvider(Clock.systemUTC()));
    }

    @Bean
    RecordCompanyDenialAuditUseCase recordCompanyDenialAuditUseCase(JdbcTemplate jdbcTemplate) {
        return new RecordCompanyDenialAudit(new JdbcAuditEntryStore(jdbcTemplate, jdbcTemplate),
                new SecurityContextCompanyDenialAuditTrustedContextProvider(Clock.systemUTC()));
    }

    @Bean
    RecordAuthenticationAuditUseCase recordAuthenticationAuditUseCase(JdbcTemplate jdbcTemplate) {
        return new JdbcAuthenticationAuditAdapter(jdbcTemplate);
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
