package com.nahui.followupbussiness.workforce.config;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.workforce.application.TerritoryService;
import com.nahui.followupbussiness.workforce.application.port.out.TerritoryStore;
import java.time.Clock;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class TerritoryServiceTransactionalProxyTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(TransactionalTerritoryConfiguration.class);

    @Test
    void startsAndCreatesProxyForTransactionalTerritoryService() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(AopUtils.isAopProxy(context.getBean(TerritoryService.class))).isTrue();
        });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableTransactionManagement
    static class TransactionalTerritoryConfiguration {
        @Bean
        TerritoryService territoryService() {
            return new TerritoryService(mock(TerritoryStore.class), mock(RecordAuditEntryUseCase.class), Clock.systemUTC());
        }

        @Bean
        PlatformTransactionManager transactionManager() {
            return mock(PlatformTransactionManager.class);
        }
    }
}
