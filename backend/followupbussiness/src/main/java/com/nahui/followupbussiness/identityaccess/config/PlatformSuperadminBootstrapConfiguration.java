package com.nahui.followupbussiness.identityaccess.config;

import com.nahui.followupbussiness.identityaccess.adapter.in.cli.BootstrapSuperadminCredentialsReader;
import com.nahui.followupbussiness.identityaccess.adapter.in.cli.PlatformSuperadminBootstrapRunner;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcBootstrapAuditAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcPlatformSuperadminAccountRepository;
import com.nahui.followupbussiness.identityaccess.adapter.out.security.BCryptPasswordHashingAdapter;
import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminService;
import com.nahui.followupbussiness.identityaccess.application.port.in.BootstrapPlatformSuperadminUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.out.BootstrapAuditPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordHashingPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PlatformSuperadminAccountRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnNotWebApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Supplier;

@Configuration(proxyBeanMethods = false)
@Profile("bootstrap-superadmin")
@ConditionalOnNotWebApplication
@ConditionalOnProperty(
        prefix = "fieldsales.bootstrap.platform-superadmin",
        name = "enabled",
        havingValue = "true")
public class PlatformSuperadminBootstrapConfiguration {

    @Bean
    BootstrapSuperadminCredentialsReader bootstrapSuperadminCredentialsReader() {
        return new BootstrapSuperadminCredentialsReader(System::getenv);
    }

    @Bean
    PasswordHashingPort bootstrapPasswordHashingPort() {
        return new BCryptPasswordHashingAdapter();
    }

    @Bean
    PlatformSuperadminAccountRepository platformSuperadminAccountRepository(
            JdbcTemplate jdbcTemplate) {
        return new JdbcPlatformSuperadminAccountRepository(jdbcTemplate);
    }

    @Bean
    BootstrapAuditPort bootstrapAuditPort(JdbcTemplate jdbcTemplate) {
        return new JdbcBootstrapAuditAdapter(jdbcTemplate);
    }

    @Bean
    BootstrapPlatformSuperadminUseCase bootstrapPlatformSuperadminUseCase(
            PlatformSuperadminAccountRepository accountRepository,
            PasswordHashingPort passwordHashingPort,
            BootstrapAuditPort auditPort,
            PlatformTransactionManager transactionManager) {
        BootstrapPlatformSuperadminService service = new BootstrapPlatformSuperadminService(
                accountRepository,
                passwordHashingPort,
                auditPort,
                Clock.systemUTC(),
                UUID::randomUUID);
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        return command -> Objects.requireNonNull(
                transactionTemplate.execute(status -> service.execute(command)),
                "Bootstrap transaction returned no result");
    }

    @Bean
    PlatformSuperadminBootstrapRunner platformSuperadminBootstrapRunner(
            ApplicationContext applicationContext,
            ConfigurableApplicationContext configurableApplicationContext,
            BootstrapSuperadminCredentialsReader credentialsReader,
            BootstrapPlatformSuperadminUseCase useCase) {
        Supplier<UUID> correlationIdGenerator = UUID::randomUUID;
        return new PlatformSuperadminBootstrapRunner(
                applicationContext,
                credentialsReader,
                useCase,
                correlationIdGenerator,
                configurableApplicationContext::close);
    }
}
