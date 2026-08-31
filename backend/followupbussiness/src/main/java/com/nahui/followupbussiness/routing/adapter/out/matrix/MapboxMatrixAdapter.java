package com.nahui.followupbussiness.routing.adapter.out.matrix;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.TravelMatrix;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Provider adapter: it carries coordinates only and exposes no Mapbox types across the port. */
public final class MapboxMatrixAdapter implements TravelMatrix {
    private static final int MAX_NODES = 11;
    private final String token;
    private final URI baseUri;
    private final Transport transport;
    private final ObjectMapper json;

    public MapboxMatrixAdapter(String token, URI baseUri, Transport transport, ObjectMapper json) {
        this.token = token; this.baseUri = baseUri; this.transport = transport; this.json = json;
    }

    @Override public Matrix calculate(List<GeoPoint> nodes) {
        if (token == null || token.isBlank()) throw new OptimizeRouteUseCase.Unavailable("PROVIDER_UNCONFIGURED");
        if (nodes == null || nodes.size() < 2 || nodes.size() > MAX_NODES || nodes.stream().anyMatch(java.util.Objects::isNull))
            throw new OptimizeRouteUseCase.Unavailable("PROVIDER_UNAVAILABLE");
        try {
            String coordinates = nodes.stream().map(point -> point.longitude() + "," + point.latitude()).reduce((left, right) -> left + ";" + right).orElseThrow();
            URI uri = URI.create(baseUri + "/mapbox/driving/" + coordinates + "?annotations=duration,distance&access_token=" + URLEncoder.encode(token, StandardCharsets.UTF_8));
            Response response = transport.get(uri);
            if (response.status() == 401 || response.status() == 403) throw new OptimizeRouteUseCase.Unavailable("PROVIDER_UNAUTHORIZED");
            if (response.status() == 429) throw new OptimizeRouteUseCase.Unavailable("PROVIDER_RATE_LIMITED");
            if (response.status() < 200 || response.status() >= 300) throw new OptimizeRouteUseCase.Unavailable("PROVIDER_UNAVAILABLE");
            JsonNode root = json.readTree(response.body());
            return new Matrix(matrix(root.path("durations"), nodes.size()), matrix(root.path("distances"), nodes.size()));
        } catch (OptimizeRouteUseCase.Unavailable ex) { throw ex;
        } catch (java.net.http.HttpTimeoutException ex) { throw new OptimizeRouteUseCase.Unavailable("PROVIDER_TIMEOUT");
        } catch (Exception ex) { throw new OptimizeRouteUseCase.Unavailable("PROVIDER_UNAVAILABLE"); }
    }

    private static long[][] matrix(JsonNode value, int size) {
        if (!value.isArray() || value.size() != size) throw new OptimizeRouteUseCase.Unavailable("PROVIDER_UNAVAILABLE");
        long[][] result = new long[size][size];
        for (int row = 0; row < size; row++) {
            JsonNode values = value.path(row);
            if (!values.isArray() || values.size() != size) throw new OptimizeRouteUseCase.Unavailable("PROVIDER_UNAVAILABLE");
            for (int column = 0; column < size; column++) {
                JsonNode cell = values.path(column);
                if (!cell.isNumber() || !Double.isFinite(cell.asDouble()) || cell.asDouble() < 0) throw new OptimizeRouteUseCase.Unavailable("PROVIDER_UNAVAILABLE");
                result[row][column] = Math.round(cell.asDouble());
            }
        }
        return result;
    }

    @FunctionalInterface public interface Transport { Response get(URI uri) throws Exception; }
    public record Response(int status, String body) { }
}
