package com.nahui.followupbussiness.tenancy.config;

import com.nahui.followupbussiness.tenancy.adapter.out.persistence.JdbcCompanyAccessStatusQuery;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration(proxyBeanMethods = false)
@ConditionalOnBean(JdbcTemplate.class)
public class TenancyConfiguration {

    @Bean
    CompanyAccessStatusQuery companyAccessStatusQuery(JdbcTemplate jdbcTemplate) {
        return new JdbcCompanyAccessStatusQuery(jdbcTemplate);
    }
}
