package com.nahui.followupbussiness.tenancy.config;

import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyAccessStatusQuery;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyCreationStore;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyCodeGenerator;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyStatusStore;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyListStore;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyDetailStore;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyCurrencyCatalog;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCurrentCompanyQuery;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanySettingsStore;
import com.nahui.followupbussiness.tenancy.application.CompanySettingsService;
import com.nahui.followupbussiness.tenancy.application.ChangeCompanyStatusService;
import com.nahui.followupbussiness.tenancy.application.CreateCompanyService;
import com.nahui.followupbussiness.tenancy.application.ListCompaniesService;
import com.nahui.followupbussiness.tenancy.application.ListCompanyCurrenciesService;
import com.nahui.followupbussiness.tenancy.application.GetCompanyService;
import com.nahui.followupbussiness.tenancy.application.port.in.ChangeCompanyStatusUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery;
import com.nahui.followupbussiness.tenancy.application.port.in.CurrentCompanyQuery;
import com.nahui.followupbussiness.tenancy.application.port.in.CreateCompanyUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.ListCompaniesUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.ListCompanyCurrenciesUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.GetCompanyUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanySettingsUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class TenancyConfiguration {

    @Bean
    CompanyAccessStatusQuery companyAccessStatusQuery(JdbcTemplate jdbcTemplate) {
        return new JdbcCompanyAccessStatusQuery(jdbcTemplate);
    }

    @Bean
    CurrentCompanyQuery currentCompanyQuery(JdbcTemplate jdbcTemplate) {
        return new JdbcCurrentCompanyQuery(jdbcTemplate);
    }

    @Bean
    CompanySettingsUseCase companySettingsUseCase(JdbcTemplate jdbcTemplate, PlatformTransactionManager transactionManager,
                                                  @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit,
                                                  MeterRegistry meters, com.nahui.followupbussiness.routing.application.port.in.InvalidatePlanningSnapshotsUseCase snapshots) {
        var service = new CompanySettingsService(new JdbcCompanySettingsStore(jdbcTemplate), audit,
                meters.counter("company.settings.updated"), meters.counter("company.settings.rejected"),
                meters.counter("company.settings.conflicts"), Clock.systemUTC(), snapshots);
        var transaction = new TransactionTemplate(transactionManager);
        return new CompanySettingsUseCase() {
            @Override public java.util.Optional<com.nahui.followupbussiness.tenancy.domain.model.Company> get(
                    com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor actor) {
                return service.get(actor);
            }
            @Override public com.nahui.followupbussiness.tenancy.domain.model.Company update(Update command,
                    com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor actor) {
                return transaction.execute(status -> service.update(command, actor));
            }
        };
    }

    @Bean
    ListCompaniesUseCase listCompaniesUseCase(JdbcTemplate jdbcTemplate) {
        return new ListCompaniesService(new JdbcCompanyListStore(jdbcTemplate));
    }

    @Bean
    GetCompanyUseCase getCompanyUseCase(JdbcTemplate jdbcTemplate) {
        return new GetCompanyService(new JdbcCompanyDetailStore(jdbcTemplate));
    }

    @Bean
    ListCompanyCurrenciesUseCase listCompanyCurrenciesUseCase(JdbcTemplate jdbcTemplate) {
        return new ListCompanyCurrenciesService(new JdbcCompanyCurrencyCatalog(jdbcTemplate));
    }

    @Bean
    public CreateCompanyUseCase createCompanyUseCase(JdbcTemplate jdbcTemplate, PlatformTransactionManager transactionManager,
                                                     RecordPlatformCompanyAuditUseCase audit,
                                                     RecordCompanyDenialAuditUseCase denialAudit) {
        var service = new CreateCompanyService(new JdbcCompanyCreationStore(jdbcTemplate), new JdbcCompanyCodeGenerator(jdbcTemplate), audit, denialAudit, Clock.systemUTC());
        var transaction = new TransactionTemplate(transactionManager);
        return (command, actor) -> {
            var result = transaction.execute(status -> service.execute(command, actor));
            if (result.denied()) throw new CreateCompanyService.AccessDeniedException();
            return result;
        };
    }

    @Bean
    public ChangeCompanyStatusUseCase changeCompanyStatusUseCase(JdbcTemplate jdbcTemplate,
                                                                 PlatformTransactionManager transactionManager, RecordPlatformCompanyAuditUseCase audit,
                                                                 RecordCompanyDenialAuditUseCase denialAudit) {
        var service = new ChangeCompanyStatusService(new JdbcCompanyStatusStore(jdbcTemplate), audit, denialAudit,
                Clock.systemUTC());
        var transaction = new TransactionTemplate(transactionManager);
        return (companyId, command, actor) -> {
            var result = transaction.execute(status -> service.execute(companyId, command, actor));
            if (result.denied()) throw new ChangeCompanyStatusService.AccessDeniedException();
            return result;
        };
    }
}
