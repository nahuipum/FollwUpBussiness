package com.nahui.followupbussiness.routing.adapter.out.matrix;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase;
import java.net.URI;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class MapboxMatrixAdapterTest {
    private static final List<GeoPoint> NODES = List.of(new GeoPoint(-12, -77), new GeoPoint(-12.1, -77.1));

    @Test void mapsMapboxDurationsAndDistancesThroughTheNeutralPort() {
        var adapter = new MapboxMatrixAdapter("test-token", URI.create("https://example.test/directions-matrix/v1"), uri -> {
            assertThat(uri.toString()).contains("/mapbox/driving/-77.0,-12.0;-77.1,-12.1", "annotations=duration,distance").doesNotContain("tenant");
            return new MapboxMatrixAdapter.Response(200, "{\"durations\":[[0,12.4],[13.6,0]],\"distances\":[[0,101.4],[102.6,0]]}");
        }, JsonMapper.builder().build());
        var matrix = adapter.calculate(NODES);
        assertThat(matrix.seconds()).isEqualTo(new long[][] {{0, 12}, {14, 0}});
        assertThat(matrix.meters()).isEqualTo(new long[][] {{0, 101}, {103, 0}});
    }

    @Test void failsClosedForMissingTokenInvalidShapeAndProviderFailures() {
        var json = JsonMapper.builder().build();
        var missingToken = new MapboxMatrixAdapter("", URI.create("https://example.test"), uri -> { throw new AssertionError(); }, json);
        var invalid = new MapboxMatrixAdapter("token", URI.create("https://example.test"), uri -> new MapboxMatrixAdapter.Response(200, "{\"durations\":[[0]],\"distances\":[[0]]}"), json);
        var unauthorized = new MapboxMatrixAdapter("token", URI.create("https://example.test"), uri -> new MapboxMatrixAdapter.Response(401, "{}"), json);
        assertThatThrownBy(() -> missingToken.calculate(NODES)).isInstanceOf(OptimizeRouteUseCase.Unavailable.class).hasMessage("PROVIDER_UNCONFIGURED");
        assertThatThrownBy(() -> invalid.calculate(NODES)).isInstanceOf(OptimizeRouteUseCase.Unavailable.class).hasMessage("PROVIDER_UNAVAILABLE");
        assertThatThrownBy(() -> unauthorized.calculate(NODES)).isInstanceOf(OptimizeRouteUseCase.Unavailable.class).hasMessage("PROVIDER_UNAUTHORIZED");
    }

    @Test void boundsTheProviderRequestToTheMvpNodeLimit() {
        var adapter = new MapboxMatrixAdapter("token", URI.create("https://example.test"), uri -> { throw new AssertionError(); }, JsonMapper.builder().build());
        var nodes = java.util.stream.IntStream.range(0, 12).mapToObj(index -> new GeoPoint(-12 - index, -77 - index)).toList();
        assertThatThrownBy(() -> adapter.calculate(nodes)).isInstanceOf(OptimizeRouteUseCase.Unavailable.class).hasMessage("PROVIDER_UNAVAILABLE");
    }
}
