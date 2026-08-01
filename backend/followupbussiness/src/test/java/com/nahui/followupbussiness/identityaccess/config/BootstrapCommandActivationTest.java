package com.nahui.followupbussiness.identityaccess.config;

import com.nahui.followupbussiness.identityaccess.adapter.in.cli.PlatformSuperadminBootstrapRunner;
import com.nahui.followupbussiness.identityaccess.application.port.in.BootstrapPlatformSuperadminUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class BootstrapCommandActivationTest {

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner()
                    .withUserConfiguration(PlatformSuperadminBootstrapConfiguration.class);

    private final WebApplicationContextRunner webContextRunner =
            new WebApplicationContextRunner()
                    .withUserConfiguration(PlatformSuperadminBootstrapConfiguration.class);

    @Test
    void profileAloneDoesNotRegisterBootstrapCommand() {
        contextRunner
                .withPropertyValues("spring.profiles.active=bootstrap-superadmin")
                .run(context -> assertThat(context)
                        .doesNotHaveBean(PlatformSuperadminBootstrapRunner.class));
    }

    @Test
    void flagAloneDoesNotRegisterBootstrapCommand() {
        contextRunner
                .withPropertyValues(
                        "fieldsales.bootstrap.platform-superadmin.enabled=true")
                .run(context -> assertThat(context)
                        .doesNotHaveBean(PlatformSuperadminBootstrapRunner.class));
    }

    @Test
    void profileAndFlagRegisterBootstrapCommand() {
        contextRunner
                .withBean(JdbcTemplate.class, () -> mock(JdbcTemplate.class))
                .withBean(
                        PlatformTransactionManager.class,
                        () -> mock(PlatformTransactionManager.class))
                .withPropertyValues(
                        "spring.profiles.active=bootstrap-superadmin",
                        "fieldsales.bootstrap.platform-superadmin.enabled=true")
                .run(context -> assertThat(context)
                        .hasSingleBean(PlatformSuperadminBootstrapRunner.class));
    }

    @Test
    void profileAndFlagDoNotRegisterBootstrapCommandInServletContext() {
        webContextRunner
                .withPropertyValues(
                        "spring.profiles.active=bootstrap-superadmin",
                        "fieldsales.bootstrap.platform-superadmin.enabled=true")
                .run(context -> assertThat(context)
                        .doesNotHaveBean(PlatformSuperadminBootstrapRunner.class)
                        .doesNotHaveBean(BootstrapPlatformSuperadminUseCase.class));
    }
}
