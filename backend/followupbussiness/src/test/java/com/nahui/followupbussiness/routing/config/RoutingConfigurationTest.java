package com.nahui.followupbussiness.routing.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class RoutingConfigurationTest {
    @Test void reusesExistingMapboxMatrixTokenWhenDirectionsSpecificTokenIsAbsent() {
        var environment = new MockEnvironment().withProperty("FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX", "matrix-token");

        assertThat(RoutingConfiguration.mapboxDirectionsToken(environment)).isEqualTo("matrix-token");
    }

    @Test void prefersDedicatedDirectionsTokenWhenBothAreConfigured() {
        var environment = new MockEnvironment()
                .withProperty("FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX", "matrix-token")
                .withProperty("MAPBOX_DIRECTIONS_TOKEN", "directions-token");

        assertThat(RoutingConfiguration.mapboxDirectionsToken(environment)).isEqualTo("directions-token");
    }
}
