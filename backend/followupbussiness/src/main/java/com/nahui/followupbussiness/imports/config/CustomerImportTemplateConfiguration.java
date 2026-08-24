package com.nahui.followupbussiness.imports.config;

import com.nahui.followupbussiness.imports.application.CustomerImportTemplateService;
import com.nahui.followupbussiness.imports.application.port.in.DownloadCustomerImportTemplateUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class CustomerImportTemplateConfiguration {

    @Bean
    DownloadCustomerImportTemplateUseCase downloadCustomerImportTemplateUseCase() {
        return new CustomerImportTemplateService();
    }
}
