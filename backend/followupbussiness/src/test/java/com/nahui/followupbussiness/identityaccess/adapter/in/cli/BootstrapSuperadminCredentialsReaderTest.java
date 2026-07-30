package com.nahui.followupbussiness.identityaccess.adapter.in.cli;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BootstrapSuperadminCredentialsReaderTest {

    @Test
    void requiredLocalValuesAreReadWithoutBindingOrDefaults() {
        String identity = "Operator-" + UUID.randomUUID() + "@Invalid.Example";
        String password = randomPassword();
        Map<String, String> environment = validEnvironment(identity, password);

        try (BootstrapSuperadminCredentials credentials =
                new BootstrapSuperadminCredentialsReader(environment::get).read()) {
            assertThat(credentials.loginIdentifier().value())
                    .isEqualTo(identity.toLowerCase(Locale.ROOT));
            assertThat(credentials.passwordCopy()).containsExactly(password.toCharArray());
        }
    }

    @Test
    void missingIdentityFailsWithSafeVariableOnlyMessage() {
        String password = randomPassword();
        Map<String, String> environment = new HashMap<>();
        environment.put(BootstrapSuperadminCredentialsReader.PASSWORD_VARIABLE, password);

        assertThatThrownBy(() -> new BootstrapSuperadminCredentialsReader(environment::get).read())
                .hasMessageContaining(BootstrapSuperadminCredentialsReader.IDENTITY_VARIABLE)
                .hasMessageNotContaining(password);
    }

    @Test
    void missingPasswordFailsWithoutEchoingIdentity() {
        String identity = "operator-" + UUID.randomUUID() + "@invalid.example";
        Map<String, String> environment = new HashMap<>();
        environment.put(BootstrapSuperadminCredentialsReader.IDENTITY_VARIABLE, identity);

        assertThatThrownBy(() -> new BootstrapSuperadminCredentialsReader(environment::get).read())
                .hasMessageContaining(BootstrapSuperadminCredentialsReader.PASSWORD_VARIABLE)
                .hasMessageNotContaining(identity);
    }

    @Test
    void rejectedPasswordNeverAppearsInValidationError() {
        String identity = "operator-" + UUID.randomUUID() + "@invalid.example";
        String rejected = " " + randomPassword();
        Map<String, String> environment = validEnvironment(identity, rejected);

        assertThatThrownBy(() -> new BootstrapSuperadminCredentialsReader(environment::get).read())
                .hasMessageContaining(BootstrapSuperadminCredentialsReader.PASSWORD_VARIABLE)
                .hasMessageNotContaining(rejected)
                .hasMessageNotContaining(identity);
    }

    @Test
    void acceptsPasswordAtBcryptUtf8ByteLimit() {
        String identity = "operator-" + UUID.randomUUID() + "@invalid.example";
        String password = "A".repeat(69) + "a1!";

        try (BootstrapSuperadminCredentials credentials =
                new BootstrapSuperadminCredentialsReader(
                        validEnvironment(identity, password)::get).read()) {
            assertThat(credentials.passwordCopy()).containsExactly(password.toCharArray());
        }
    }

    @Test
    void rejectsAsciiPasswordAboveBcryptByteLimitWithoutEchoingIt() {
        String identity = "operator-" + UUID.randomUUID() + "@invalid.example";
        String password = "A".repeat(70) + "a1!";

        assertThatThrownBy(() -> new BootstrapSuperadminCredentialsReader(
                validEnvironment(identity, password)::get).read())
                .hasMessageContaining(BootstrapSuperadminCredentialsReader.PASSWORD_VARIABLE)
                .hasMessageContaining("72 UTF-8 bytes")
                .hasMessageNotContaining(password)
                .hasMessageNotContaining(identity);
    }

    @Test
    void rejectsMultibytePasswordAboveBcryptByteLimitWithoutEchoingIt() {
        String identity = "operator-" + UUID.randomUUID() + "@invalid.example";
        String password = "á".repeat(36) + "Aa1!";

        assertThatThrownBy(() -> new BootstrapSuperadminCredentialsReader(
                validEnvironment(identity, password)::get).read())
                .hasMessageContaining(BootstrapSuperadminCredentialsReader.PASSWORD_VARIABLE)
                .hasMessageContaining("72 UTF-8 bytes")
                .hasMessageNotContaining(password)
                .hasMessageNotContaining(identity);
    }

    private static Map<String, String> validEnvironment(String identity, String password) {
        Map<String, String> environment = new HashMap<>();
        environment.put(BootstrapSuperadminCredentialsReader.IDENTITY_VARIABLE, identity);
        environment.put(BootstrapSuperadminCredentialsReader.PASSWORD_VARIABLE, password);
        return environment;
    }

    private static String randomPassword() {
        return UUID.randomUUID() + "!Aa123456";
    }
}
