package com.nahui.followupbussiness.routing.adapter.out.directions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.routing.application.GetRouteDirectionsService.RouteDirectionsUnavailable;
import java.net.URI;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class MapboxDirectionsAdapterTest {
    private static final String ROUTE = "{\"routes\":[{\"distance\":100.4,\"duration\":20.6,\"geometry\":{\"coordinates\":[[-77.0,-12.0],[-77.1,-12.1]]},\"legs\":[{\"distance\":100.4,\"duration\":20.6,\"steps\":[{\"distance\":100.4,\"duration\":20.6,\"maneuver\":{\"instruction\":\"Continue\"}}]}]}]}";

    @Test void splitsFiftyOneCoordinatesIntoOverlappingRequestsAndAssemblesNeutralResult() {
        AtomicInteger calls = new AtomicInteger();
        var adapter = new MapboxDirectionsAdapter("test-token", URI.create("https://example.test/directions/v5"), uri -> { calls.incrementAndGet(); return new MapboxDirectionsAdapter.Response(200, routeFor((int) uri.toString().chars().filter(character -> character == ';').count())); }, JsonMapper.builder().build());
        List<GeoPoint> coordinates = java.util.stream.IntStream.range(0, 51).mapToObj(index -> new GeoPoint(-12 - index * .001, -77 - index * .001)).toList();

        var result = adapter.calculate(coordinates);

        assertThat(calls).hasValue(3);
        assertThat(result.legs()).hasSize(50);
        assertThat(result.distanceMeters()).isEqualTo(300);
        assertThat(result.durationSeconds()).isEqualTo(63);
        assertThat(result.geometry()).hasSize(4);
        assertThat(result.legs().getFirst().instructions().getFirst().text()).isEqualTo("Continue");
    }

    @Test void failsClosedWhenTokenIsMissingOrProviderRejectsRequest() {
        var noToken = new MapboxDirectionsAdapter("", URI.create("https://example.test/directions/v5"), uri -> { throw new AssertionError(); }, JsonMapper.builder().build());
        var rejected = new MapboxDirectionsAdapter("test-token", URI.create("https://example.test/directions/v5"), uri -> new MapboxDirectionsAdapter.Response(401, "{}"), JsonMapper.builder().build());
        List<GeoPoint> points = List.of(new GeoPoint(0, 0), new GeoPoint(1, 1));

        assertThatThrownBy(() -> noToken.calculate(points)).isInstanceOf(RouteDirectionsUnavailable.class);
        assertThatThrownBy(() -> rejected.calculate(points)).isInstanceOf(RouteDirectionsUnavailable.class);
    }

    @Test void failsClosedForHttpSuccessWithoutUsableRoute() {
        var malformed = new MapboxDirectionsAdapter("test-token", URI.create("https://example.test/directions/v5"), uri -> new MapboxDirectionsAdapter.Response(200, "{\"routes\":[{}]}"), JsonMapper.builder().build());

        assertThatThrownBy(() -> malformed.calculate(List.of(new GeoPoint(0, 0), new GeoPoint(1, 1)))).isInstanceOf(RouteDirectionsUnavailable.class);
    }

    private static String routeFor(int legs) {
        String leg = "{\"distance\":100.4,\"duration\":20.6,\"steps\":[{\"distance\":100.4,\"duration\":20.6,\"maneuver\":{\"instruction\":\"Continue\"}}]}";
        return "{\"routes\":[{\"distance\":100.4,\"duration\":20.6,\"geometry\":{\"coordinates\":[[-77.0,-12.0],[-77.1,-12.1]]},\"legs\":[" + String.join(",", java.util.Collections.nCopies(legs, leg)) + "]}]}";
    }
}
