package com.nahui.followupbussiness.tenancy.config;

import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyAccessStatusQuery;
import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyCreationStore;
import com.nahui.followupbussiness.tenancy.application.CreateCompanyService;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery;
import com.nahui.followupbussiness.tenancy.application.port.in.CreateCompanyUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Clock;

@Configuration(proxyBeanMethods = false)
@ConditionalOnBean(JdbcTemplate.class)
public class TenancyConfiguration {

    @Bean
    CompanyAccessStatusQuery companyAccessStatusQuery(JdbcTemplate jdbcTemplate) {
        return new JdbcCompanyAccessStatusQuery(jdbcTemplate);
    }

    @Bean
    public CreateCompanyUseCase createCompanyUseCase(JdbcTemplate jdbcTemplate, PlatformTransactionManager transactionManager,
            RecordPlatformCompanyAuditUseCase audit,
            RecordCompanyDenialAuditUseCase denialAudit) {
        var service = new CreateCompanyService(new JdbcCompanyCreationStore(jdbcTemplate), audit, denialAudit, Clock.systemUTC());
        var transaction = new TransactionTemplate(transactionManager);
        return (command, actor) -> {
            var result = transaction.execute(status -> service.execute(command, actor));
            if (result.denied()) throw new CreateCompanyService.AccessDeniedException();
            return result;
        };
    }
}
