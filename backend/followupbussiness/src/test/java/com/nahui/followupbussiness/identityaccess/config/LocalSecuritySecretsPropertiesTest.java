package com.nahui.followupbussiness.identityaccess.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LocalSecuritySecretsPropertiesTest {

    private static final String TEST_ONLY_SECRET = "TEST_ONLY_NON_SECRET_012345678901234567890123456789";
    private static final List<String> REJECTED_PLACEHOLDERS = List.of(
            "change_me_local_only",
            "replace_with_32_plus_random_local_characters");

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner().withUserConfiguration(SecretPropertiesConfiguration.class);

    @Test
    void startsWhenRequiredLocalSecretIsPresent() {
        contextRunner
                .withPropertyValues("field-sales.security.local-secret=" + TEST_ONLY_SECRET)
                .run(context -> {
                    assertNull(context.getStartupFailure());
                    assertNotNull(context.getBean(LocalSecuritySecretsProperties.class));
                });
    }

    @Test
    void failsSafelyWhenRequiredLocalSecretIsMissing() {
        contextRunner.run(context -> {
            Throwable rootCause = rootCause(context.getStartupFailure());

            assertEquals(
                    "FIELD_SALES_SECURITY_LOCAL_SECRET is required; its value was not logged",
                    rootCause.getMessage());
            assertFalse(rootCause.getMessage().contains(TEST_ONLY_SECRET));
        });
    }

    @Test
    void failsSafelyWhenDocumentedPlaceholderWasNotReplaced() {
        contextRunner
                .withPropertyValues("field-sales.security.local-secret=" + REJECTED_PLACEHOLDERS.get(1))
                .run(context -> {
                    Throwable rootCause = rootCause(context.getStartupFailure());

                    assertEquals(
                            "FIELD_SALES_SECURITY_LOCAL_SECRET must be a non-placeholder value of at least 32 "
                                    + "characters; its value was not logged",
                            rootCause.getMessage());
                    assertFalse(rootCause.getMessage().contains(REJECTED_PLACEHOLDERS.get(1)));
                });
    }

    @ParameterizedTest
    @MethodSource("placeholderVariantsWithBoundaryWhitespace")
    void rejectsBoundaryWhitespaceAroundEveryPlaceholderWithoutLoggingValue(String candidate) {
        IllegalStateException exception = validateDirectly(candidate);

        assertEquals(
                "FIELD_SALES_SECURITY_LOCAL_SECRET must not contain leading or trailing whitespace; "
                        + "its value was not logged",
                exception.getMessage());
        assertFalse(exception.getMessage().contains(candidate));
    }

    @ParameterizedTest
    @MethodSource("validSecretsWithoutBoundaryWhitespace")
    void acceptsValidSecretsWithoutBoundaryWhitespace(String candidate) {
        LocalSecuritySecretsProperties properties = new LocalSecuritySecretsProperties();
        properties.setLocalSecret(candidate);

        properties.afterPropertiesSet();
    }

    @ParameterizedTest
    @MethodSource("nonPlaceholderValuesWithBoundaryWhitespace")
    void rejectsBoundaryWhitespaceAroundNonPlaceholderValuesWithoutLoggingValue(String candidate) {
        IllegalStateException exception = validateDirectly(candidate);

        assertEquals(
                "FIELD_SALES_SECURITY_LOCAL_SECRET must not contain leading or trailing whitespace; "
                        + "its value was not logged",
                exception.getMessage());
        assertFalse(exception.getMessage().contains(candidate));
    }

    private static Stream<String> placeholderVariantsWithBoundaryWhitespace() {
        return REJECTED_PLACEHOLDERS.stream().flatMap(placeholder -> Stream.of(
                " " + placeholder + " ",
                "\t" + placeholder + "\t",
                "\r" + placeholder + "\r",
                "\n" + placeholder + "\n",
                "\r\n" + placeholder + "\r\n"));
    }

    private static Stream<String> validSecretsWithoutBoundaryWhitespace() {
        return Stream.of(
                TEST_ONLY_SECRET,
                "ANOTHER_TEST_ONLY_NON_SECRET_ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                "TEST_ONLY_SECRET_WITH_INTERNAL SPACE_0123456789012345");
    }

    private static Stream<String> nonPlaceholderValuesWithBoundaryWhitespace() {
        return Stream.of(
                " " + TEST_ONLY_SECRET,
                TEST_ONLY_SECRET + "\t",
                "\r\n" + TEST_ONLY_SECRET + "\n");
    }

    private static IllegalStateException validateDirectly(String candidate) {
        LocalSecuritySecretsProperties properties = new LocalSecuritySecretsProperties();
        properties.setLocalSecret(candidate);
        return assertThrows(IllegalStateException.class, properties::afterPropertiesSet);
    }

    private static Throwable rootCause(Throwable failure) {
        assertNotNull(failure);
        Throwable root = failure;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return root;
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(LocalSecuritySecretsProperties.class)
    static class SecretPropertiesConfiguration {
    }
}
