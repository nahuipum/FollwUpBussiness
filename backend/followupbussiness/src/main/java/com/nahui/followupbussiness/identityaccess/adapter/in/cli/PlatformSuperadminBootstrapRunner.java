package com.nahui.followupbussiness.identityaccess.adapter.in.cli;

import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminCommand;
import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminResult;
import com.nahui.followupbussiness.identityaccess.application.port.in.BootstrapPlatformSuperadminUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.out.BootstrapAuditPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;
import java.util.function.Supplier;

public final class PlatformSuperadminBootstrapRunner implements ApplicationRunner {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(PlatformSuperadminBootstrapRunner.class);

    private final ApplicationContext applicationContext;
    private final BootstrapSuperadminCredentialsReader credentialsReader;
    private final BootstrapPlatformSuperadminUseCase useCase;
    private final Supplier<UUID> correlationIdGenerator;
    private final Runnable contextCloser;

    public PlatformSuperadminBootstrapRunner(
            ApplicationContext applicationContext,
            BootstrapSuperadminCredentialsReader credentialsReader,
            BootstrapPlatformSuperadminUseCase useCase,
            Supplier<UUID> correlationIdGenerator,
            Runnable contextCloser) {
        this.applicationContext = applicationContext;
        this.credentialsReader = credentialsReader;
        this.useCase = useCase;
        this.correlationIdGenerator = correlationIdGenerator;
        this.contextCloser = contextCloser;
    }

    @Override
    public void run(ApplicationArguments args) {
        UUID correlationId = correlationIdGenerator.get();
        try {
            if (applicationContext instanceof WebApplicationContext) {
                logResult("REJECTED_WEB_CONTEXT", correlationId);
                throw new SafeBootstrapCommandException(
                        "Platform superadmin bootstrap requires spring.main.web-application-type=none; "
                                + "correlationId=" + correlationId);
            }

            try (BootstrapSuperadminCredentials credentials = credentialsReader.read();
                    BootstrapPlatformSuperadminCommand command =
                            new BootstrapPlatformSuperadminCommand(
                                    credentials.loginIdentifier(),
                                    credentials.passwordCopy(),
                                    correlationId)) {
                BootstrapPlatformSuperadminResult result = useCase.execute(command);
                logResult(result.status().name(), correlationId);
                if (result.status() == BootstrapPlatformSuperadminResult.Status.CONFLICT) {
                    throw new SafeBootstrapCommandException(
                            "Platform superadmin bootstrap was rejected due to existing account state; "
                                    + "correlationId=" + correlationId);
                }
            }
        } catch (SafeBootstrapConfigurationException exception) {
            logResult("FAILED", correlationId);
            throw exception;
        } catch (SafeBootstrapCommandException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            logResult("FAILED", correlationId);
            throw new SafeBootstrapCommandException(
                    "Platform superadmin bootstrap failed safely; correlationId=" + correlationId);
        } finally {
            try {
                contextCloser.run();
            } catch (RuntimeException exception) {
                logResult("FAILED", correlationId);
                throw new SafeBootstrapCommandException(
                        "Platform superadmin bootstrap context could not close safely; correlationId="
                                + correlationId);
            }
        }
    }

    private static void logResult(String result, UUID correlationId) {
        LOGGER.info(
                "operation={} result={} correlationId={}",
                BootstrapAuditPort.OPERATION,
                result,
                correlationId);
    }
}
