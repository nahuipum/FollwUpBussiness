package com.nahui.followupbussiness.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class DependencySecurityPolicyTest {

    private static final String MINIMUM_TOMCAT_VERSION = "11.0.24";
    private static final String MINIMUM_POSTGRESQL_DRIVER_VERSION = "42.7.12";
    private static final String MINIMUM_JACKSON_DATABIND_VERSION = "3.1.5";

    @ParameterizedTest
    @ValueSource(strings = {
            "org.apache.catalina.startup.Tomcat",
            "org.apache.el.ExpressionFactoryImpl",
            "org.apache.tomcat.websocket.WsWebSocketContainer"
    })
    void embeddedTomcatModulesMeetSecurityBaseline(String className) throws ClassNotFoundException {
        Class<?> tomcatModuleClass = Class.forName(className);
        String implementationVersion = tomcatModuleClass.getPackage().getImplementationVersion();

        assertThat(implementationVersion)
                .as("implementation version for %s", className)
                .isNotNull()
                .doesNotStartWith("11.0.22");
        assertThat(compareVersions(implementationVersion, MINIMUM_TOMCAT_VERSION))
                .as("%s must be at least %s", className, MINIMUM_TOMCAT_VERSION)
                .isGreaterThanOrEqualTo(0);
    }

    @Test
    void postgresqlDriverMeetsSecurityBaseline() throws ClassNotFoundException {
        assertDependencyVersionAtLeast(
                "org.postgresql.Driver",
                MINIMUM_POSTGRESQL_DRIVER_VERSION,
                "42.7.11");
    }

    @Test
    void jacksonDatabindMeetsSecurityBaseline() throws ClassNotFoundException {
        assertDependencyVersionAtLeast(
                "tools.jackson.databind.ObjectMapper",
                MINIMUM_JACKSON_DATABIND_VERSION,
                "3.1.4");
    }

    private static void assertDependencyVersionAtLeast(
            String className,
            String minimumVersion,
            String prohibitedVersion) throws ClassNotFoundException {
        Class<?> dependencyClass = Class.forName(className);
        String implementationVersion = dependencyClass.getPackage().getImplementationVersion();

        assertThat(implementationVersion)
                .as("implementation version for %s", className)
                .isNotNull()
                .isNotEqualTo(prohibitedVersion);
        assertThat(compareVersions(implementationVersion, minimumVersion))
                .as("%s must be at least %s", className, minimumVersion)
                .isGreaterThanOrEqualTo(0);
    }

    private static int compareVersions(String actual, String minimum) {
        int[] actualParts = versionParts(actual);
        int[] minimumParts = versionParts(minimum);
        for (int index = 0; index < Math.max(actualParts.length, minimumParts.length); index++) {
            int actualPart = index < actualParts.length ? actualParts[index] : 0;
            int minimumPart = index < minimumParts.length ? minimumParts[index] : 0;
            if (actualPart != minimumPart) {
                return Integer.compare(actualPart, minimumPart);
            }
        }
        return 0;
    }

    private static int[] versionParts(String version) {
        return Arrays.stream(version.split("\\."))
                .mapToInt(Integer::parseInt)
                .toArray();
    }
}
