package com.nahui.followupbussiness.identityaccess.adapter.in.cli;

import com.nahui.followupbussiness.identityaccess.application.BootstrapPlatformSuperadminResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.support.StaticApplicationContext;
import org.springframework.web.context.support.StaticWebApplicationContext;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(OutputCaptureExtension.class)
class PlatformSuperadminBootstrapRunnerTest {

    @Test
    void nonWebExecutionLogsOnlySafeAuditFields(CapturedOutput output) {
        String identity = "operator-" + UUID.randomUUID() + "@invalid.example";
        String password = UUID.randomUUID() + "!Aa123456";
        String hashSentinel = "$2a$12$" + "D".repeat(53);
        Map<String, String> environment = validEnvironment(identity, password);
        UUID correlationId = UUID.randomUUID();
        AtomicBoolean closed = new AtomicBoolean();
        PlatformSuperadminBootstrapRunner runner = new PlatformSuperadminBootstrapRunner(
                new StaticApplicationContext(),
                new BootstrapSuperadminCredentialsReader(environment::get),
                command -> new BootstrapPlatformSuperadminResult(
                        BootstrapPlatformSuperadminResult.Status.CREATED,
                        UUID.randomUUID(),
                        command.correlationId()),
                () -> correlationId,
                () -> closed.set(true));

        runner.run(new DefaultApplicationArguments(new String[0]));

        assertThat(output.getOut())
                .contains("operation=PLATFORM_SUPERADMIN_BOOTSTRAP")
                .contains("result=CREATED")
                .contains("correlationId=" + correlationId)
                .doesNotContain(identity)
                .doesNotContain(password)
                .doesNotContain(hashSentinel);
        assertThat(closed).isTrue();
    }

    @Test
    void webContextIsRejectedBeforeCredentialsOrUseCaseAreRead(CapturedOutput output) {
        AtomicInteger reads = new AtomicInteger();
        AtomicInteger executions = new AtomicInteger();
        UUID correlationId = UUID.randomUUID();
        PlatformSuperadminBootstrapRunner runner = new PlatformSuperadminBootstrapRunner(
                new StaticWebApplicationContext(),
                new BootstrapSuperadminCredentialsReader(name -> {
                    reads.incrementAndGet();
                    return null;
                }),
                command -> {
                    executions.incrementAndGet();
                    return new BootstrapPlatformSuperadminResult(
                            BootstrapPlatformSuperadminResult.Status.CREATED,
                            UUID.randomUUID(),
                            command.correlationId());
                },
                () -> correlationId,
                () -> {
                });

        assertThatThrownBy(() -> runner.run(new DefaultApplicationArguments(new String[0])))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("web-application-type=none")
                .hasMessageContaining(correlationId.toString());

        assertThat(reads).hasValue(0);
        assertThat(executions).hasValue(0);
        assertThat(output.getOut())
                .contains("result=REJECTED_WEB_CONTEXT")
                .doesNotContainIgnoringCase("password")
                .doesNotContain(BootstrapSuperadminCredentialsReader.IDENTITY_VARIABLE);
    }

    @Test
    void unexpectedFailureIsSanitizedWithoutCauseOrSensitiveMarkers(CapturedOutput output) {
        String identity = "operator-" + UUID.randomUUID() + "@invalid.example";
        String password = UUID.randomUUID() + "!Aa123456";
        String sensitiveSqlMarker = "SENSITIVE_SQL_ROW_" + UUID.randomUUID();
        Map<String, String> environment = validEnvironment(identity, password);
        UUID correlationId = UUID.randomUUID();
        AtomicBoolean closed = new AtomicBoolean();
        PlatformSuperadminBootstrapRunner runner = new PlatformSuperadminBootstrapRunner(
                new StaticApplicationContext(),
                new BootstrapSuperadminCredentialsReader(environment::get),
                command -> {
                    throw new IllegalStateException(
                            sensitiveSqlMarker + " identity=" + identity + " hash=" + password);
                },
                () -> correlationId,
                () -> closed.set(true));

        assertThatThrownBy(() -> runner.run(new DefaultApplicationArguments(new String[0])))
                .isInstanceOf(SafeBootstrapCommandException.class)
                .hasNoCause()
                .hasMessageContaining(correlationId.toString())
                .hasMessageNotContaining(sensitiveSqlMarker)
                .hasMessageNotContaining(identity)
                .hasMessageNotContaining(password);

        assertThat(output.getOut())
                .contains("result=FAILED")
                .contains("correlationId=" + correlationId)
                .doesNotContain(sensitiveSqlMarker)
                .doesNotContain(identity)
                .doesNotContain(password);
        assertThat(closed).isTrue();
    }

    private static Map<String, String> validEnvironment(String identity, String password) {
        Map<String, String> environment = new HashMap<>();
        environment.put(BootstrapSuperadminCredentialsReader.IDENTITY_VARIABLE, identity);
        environment.put(BootstrapSuperadminCredentialsReader.PASSWORD_VARIABLE, password);
        environment.put(BootstrapSuperadminCredentialsReader.DISPLAY_NAME_VARIABLE, "Platform Administrator");
        environment.put(BootstrapSuperadminCredentialsReader.EMAIL_VARIABLE, "bootstrap@invalid.example");
        return environment;
    }
}
