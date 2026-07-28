package com.nahui.followupbussiness.security;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class DependencySecurityPolicyTest {

    private static final String MINIMUM_TOMCAT_VERSION = "11.0.24";

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
