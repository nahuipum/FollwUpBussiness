package com.nahui.followupbussiness.routing.adapter.out.directions;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.routing.application.GetRouteDirectionsService.RouteDirectionsUnavailable;
import com.nahui.followupbussiness.routing.application.port.out.RouteDirections;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Mapbox-specific HTTP adapter; it neither receives nor emits tenant or business identifiers. */
public final class MapboxDirectionsAdapter implements RouteDirections {
    private static final int MAX_COORDINATES_PER_REQUEST = 25;
    private final String token;
    private final URI baseUri;
    private final Transport transport;
    private final ObjectMapper json;

    public MapboxDirectionsAdapter(String token, URI baseUri, Transport transport, ObjectMapper json) {
        this.token = token; this.baseUri = baseUri; this.transport = transport; this.json = json;
    }

    @Override public Directions calculate(List<GeoPoint> coordinates) {
        if (token == null || token.isBlank() || coordinates == null || coordinates.size() < 2) throw new RouteDirectionsUnavailable();
        List<GeoPoint> geometry = new ArrayList<>(); List<Leg> legs = new ArrayList<>(); long meters = 0, seconds = 0;
        for (int start = 0; start < coordinates.size() - 1; start += MAX_COORDINATES_PER_REQUEST - 1) {
            int end = Math.min(start + MAX_COORDINATES_PER_REQUEST, coordinates.size());
            Parsed parsed = request(coordinates.subList(start, end));
            if (!geometry.isEmpty() && !parsed.geometry().isEmpty()) geometry.removeLast();
            geometry.addAll(parsed.geometry()); legs.addAll(parsed.legs()); meters += parsed.meters(); seconds += parsed.seconds();
        }
        return new Directions(geometry, legs, meters, seconds);
    }

    private Parsed request(List<GeoPoint> coordinates) {
        try {
            String joined = coordinates.stream().map(point -> point.longitude() + "," + point.latitude()).reduce((a, b) -> a + ";" + b).orElseThrow();
            URI uri = URI.create(baseUri.toString() + "/mapbox/driving/" + joined + "?geometries=geojson&overview=full&steps=true&access_token=" + URLEncoder.encode(token, StandardCharsets.UTF_8));
            Response response = transport.get(uri);
            if (response.status() < 200 || response.status() >= 300) throw new RouteDirectionsUnavailable();
            JsonNode route = json.readTree(response.body()).path("routes").path(0);
            if (!route.isObject() || !nonNegative(route.path("distance")) || !nonNegative(route.path("duration"))) throw new RouteDirectionsUnavailable();
            List<GeoPoint> geometry = new ArrayList<>();
            for (JsonNode coordinate : route.path("geometry").path("coordinates")) geometry.add(new GeoPoint(coordinate.path(1).asDouble(Double.NaN), coordinate.path(0).asDouble(Double.NaN)));
            if (geometry.size() < 2) throw new RouteDirectionsUnavailable();
            List<Leg> legs = new ArrayList<>();
            for (JsonNode leg : route.path("legs")) {
                if (!leg.isObject() || !nonNegative(leg.path("distance")) || !nonNegative(leg.path("duration"))) throw new RouteDirectionsUnavailable();
                List<Instruction> instructions = new ArrayList<>();
                for (JsonNode step : leg.path("steps")) {
                    if (!step.isObject() || !nonNegative(step.path("distance")) || !nonNegative(step.path("duration")) || step.path("maneuver").path("instruction").asText("").isBlank()) throw new RouteDirectionsUnavailable();
                    instructions.add(new Instruction(step.path("maneuver").path("instruction").asText(), rounded(step.path("distance")), rounded(step.path("duration"))));
                }
                legs.add(new Leg(rounded(leg.path("distance")), rounded(leg.path("duration")), instructions));
            }
            if (legs.size() != coordinates.size() - 1) throw new RouteDirectionsUnavailable();
            return new Parsed(geometry, legs, rounded(route.path("distance")), rounded(route.path("duration")));
        } catch (RouteDirectionsUnavailable ex) { throw ex; }
        catch (Exception ex) { throw new RouteDirectionsUnavailable(); }
    }

    private static long rounded(JsonNode value) { return value.isNumber() && value.asDouble() >= 0 ? Math.round(value.asDouble()) : 0; }
    private static boolean nonNegative(JsonNode value) { return value.isNumber() && Double.isFinite(value.asDouble()) && value.asDouble() >= 0; }
    private record Parsed(List<GeoPoint> geometry, List<Leg> legs, long meters, long seconds) { }
    @FunctionalInterface public interface Transport { Response get(URI uri) throws Exception; }
    public record Response(int status, String body) { }
}
