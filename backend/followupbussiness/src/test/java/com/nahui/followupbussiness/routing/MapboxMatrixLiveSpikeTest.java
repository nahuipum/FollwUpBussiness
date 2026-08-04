package com.nahui.followupbussiness.routing;

import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class MapboxMatrixLiveSpikeTest {
    private static final List<String> TOKEN_ENV_ALIASES = List.of(
            "FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX",
            "FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX_SPIKE_KEY",
            "MAPBOX_ACCESS_TOKEN");
    private static final int NODE_COUNT = 11;
    private static final int ELEMENT_COUNT = NODE_COUNT * NODE_COUNT;
    private static final long MAX_ACCEPTED_LATENCY_MILLIS = 15_000;
    private static final Pattern MATRIX_ROW = Pattern.compile("\\[([^\\[\\]]*)]");
    private static final List<Coordinate> PERU_NODES = List.of(
            new Coordinate(-77.042793, -12.046374),
            new Coordinate(-77.036526, -12.059132),
            new Coordinate(-77.028241, -12.066185),
            new Coordinate(-77.046599, -12.073482),
            new Coordinate(-77.058218, -12.064044),
            new Coordinate(-77.063103, -12.050772),
            new Coordinate(-77.054815, -12.039216),
            new Coordinate(-77.037324, -12.036580),
            new Coordinate(-77.021608, -12.048872),
            new Coordinate(-77.017205, -12.061893),
            new Coordinate(-77.050301, -12.082019));
    private static final List<Coordinate> PERU_CONNECTIVITY_NODES = List.of(
            new Coordinate(-77.042793, -12.046374),
            new Coordinate(-71.537451, -16.398866),
            new Coordinate(-71.967463, -13.531950));
    private static final List<Coordinate> OVER_LIMIT_NODES = IntStream.range(0, 26)
            .mapToObj(index -> new Coordinate(
                    -77.100000 + (index % 13) * 0.005,
                    -12.100000 + (index / 13) * 0.010))
            .toList();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    @Test
    void rejectsMatrixRequestWithoutAccessToken() throws Exception {
        requireLiveToken();

        HttpResponse<String> response = send(matrixUri(PERU_NODES, null));

        assertThat(response.statusCode()).isEqualTo(401);
    }

    @Test
    void rejectsMoreThanTwentyFiveCoordinates() throws Exception {
        String token = requireLiveToken();

        HttpResponse<String> response = send(matrixUri(OVER_LIMIT_NODES, token));

        assertThat(response.statusCode()).isEqualTo(422);
    }

    @Test
    void validatesRoadConnectivityBetweenLimaArequipaAndCusco() throws Exception {
        String token = requireLiveToken();

        HttpResponse<String> response = send(matrixUri(PERU_CONNECTIVITY_NODES, token));

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).containsPattern("\\\"code\\\"\\s*:\\s*\\\"Ok\\\"");
        assertMatrix(matrix(response.body(), "durations"), PERU_CONNECTIVITY_NODES.size());
        assertMatrix(matrix(response.body(), "distances"), PERU_CONNECTIVITY_NODES.size());
    }

    @Test
    void validatesPeruElevenNodeMatrixWithDistinctStartAndEnd() throws Exception {
        String token = requireLiveToken();
        assertThat(PERU_NODES).hasSize(NODE_COUNT).doesNotHaveDuplicates();
        assertThat(PERU_NODES.getFirst()).isNotEqualTo(PERU_NODES.getLast());
        assertThat(PERU_NODES).allSatisfy(coordinate -> {
            assertThat(coordinate.latitude()).isBetween(-19.0, 1.0);
            assertThat(coordinate.longitude()).isBetween(-82.0, -68.0);
        });

        long startedNanos = System.nanoTime();
        HttpResponse<String> response = send(matrixUri(PERU_NODES, token));
        long latencyMillis = Duration.ofNanos(System.nanoTime() - startedNanos).toMillis();

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(latencyMillis).isLessThan(MAX_ACCEPTED_LATENCY_MILLIS);
        assertThat(response.body()).containsPattern("\\\"code\\\"\\s*:\\s*\\\"Ok\\\"");

        List<List<Double>> durations = matrix(response.body(), "durations");
        List<List<Double>> distances = matrix(response.body(), "distances");
        assertMatrix(durations, NODE_COUNT);
        assertMatrix(distances, NODE_COUNT);

        System.out.printf(
                "EN-018 Mapbox Matrix live spike: nodes=%d elements=%d latencyMs=%d status=200%n",
                NODE_COUNT,
                ELEMENT_COUNT,
                latencyMillis);
    }

    private String requireLiveToken() {
        String token = TOKEN_ENV_ALIASES.stream()
                .map(System::getenv)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .findFirst()
                .orElse(null);
        assumeTrue(token != null,
                "EN-018 live spike skipped: provide one of " + TOKEN_ENV_ALIASES);
        return token;
    }

    private HttpResponse<String> send(URI uri) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .GET()
                .build();
        return httpClient.send(request,
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    }

    private static URI matrixUri(List<Coordinate> nodes, String token) {
        String coordinates = nodes.stream()
                .map(Coordinate::pathSegment)
                .reduce((left, right) -> left + ";" + right)
                .orElseThrow();
        String query = "?annotations=duration,distance";
        if (token != null) {
            query += "&access_token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        }
        return URI.create("https://api.mapbox.com/directions-matrix/v1/mapbox/driving/"
                + coordinates + query);
    }

    private static List<List<Double>> matrix(String body, String field) {
        int fieldIndex = body.indexOf("\"" + field + "\"");
        assertThat(fieldIndex).as("field %s is present", field).isGreaterThanOrEqualTo(0);
        int start = body.indexOf('[', fieldIndex);
        assertThat(start).as("field %s is an array", field).isGreaterThan(fieldIndex);
        int end = matchingBracket(body, start);
        assertThat(end).as("field %s has a closing bracket", field).isGreaterThan(start);

        Matcher rowMatcher = MATRIX_ROW.matcher(body.substring(start, end + 1));
        List<List<Double>> rows = new ArrayList<>();
        while (rowMatcher.find()) {
            String[] cells = rowMatcher.group(1).split(",", -1);
            List<Double> row = new ArrayList<>(cells.length);
            for (String cell : cells) {
                String value = cell.trim();
                assertThat(value).as("matrix cell is not empty").isNotEmpty();
                row.add("null".equals(value) ? null : Double.valueOf(value));
            }
            rows.add(row);
        }
        return rows;
    }

    private static int matchingBracket(String body, int start) {
        int depth = 0;
        for (int index = start; index < body.length(); index++) {
            char character = body.charAt(index);
            if (character == '[') depth++;
            if (character == ']' && --depth == 0) return index;
        }
        return -1;
    }

    private static void assertMatrix(List<List<Double>> matrix, int nodeCount) {
        assertThat(matrix).hasSize(nodeCount);
        int elements = 0;
        for (int rowIndex = 0; rowIndex < matrix.size(); rowIndex++) {
            List<Double> row = matrix.get(rowIndex);
            assertThat(row).hasSize(nodeCount);
            for (int columnIndex = 0; columnIndex < row.size(); columnIndex++) {
                Double value = row.get(columnIndex);
                assertThat(value).isNotNull().isFinite().isGreaterThanOrEqualTo(0.0);
                if (rowIndex == columnIndex) {
                    assertThat(value).isZero();
                } else {
                    assertThat(value).isPositive();
                }
                elements++;
            }
        }
        assertThat(elements).isEqualTo(nodeCount * nodeCount);
    }

    private record Coordinate(double longitude, double latitude) {
        private String pathSegment() {
            return String.format(Locale.ROOT, "%.6f,%.6f", longitude, latitude);
        }
    }
}
