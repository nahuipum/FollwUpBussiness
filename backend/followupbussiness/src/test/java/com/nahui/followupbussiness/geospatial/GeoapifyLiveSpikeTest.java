package com.nahui.followupbussiness.geospatial;

import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class GeoapifyLiveSpikeTest {

    private static final String API_KEY_ENV = "FOLLOW_UP_BUSSINESS_GEOAPIFY_SPIKE_KEY";
    private static final Pattern COUNTRY_CODE =
            Pattern.compile("\"country_code\"\\s*:\\s*\"pe\"");
    private static final Pattern LATITUDE =
            Pattern.compile("\"lat\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)");
    private static final Pattern LONGITUDE =
            Pattern.compile("\"lon\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)");
    private static final List<String> PERU_ADDRESSES = List.of(
            "Plaza Mayor de Lima, Cercado de Lima, Lima, Peru",
            "Plaza de Armas, Arequipa, Peru",
            "Plaza de Armas, Cusco, Peru");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Test
    void validatesPeruGeocodingMapLibreStyleAndBurstBehavior() throws Exception {
        String apiKey = System.getenv(API_KEY_ENV);
        assumeTrue(apiKey != null && !apiKey.isBlank(),
                "EN-014 live spike skipped: " + API_KEY_ENV + " is not available");

        for (String address : PERU_ADDRESSES) {
            HttpResponse<String> response = send(geocodingUri(address, apiKey));
            assertThat(response.statusCode()).isEqualTo(200);
            assertPeruCandidate(response.body());
        }

        HttpResponse<String> styleResponse = send(styleUri(apiKey));
        assertThat(styleResponse.statusCode()).isEqualTo(200);
        assertThat(styleResponse.body())
                .contains("\"version\"")
                .contains("\"sources\"")
                .contains("\"layers\"");

        URI burstUri = geocodingUri(PERU_ADDRESSES.getFirst(), apiKey);
        List<CompletableFuture<HttpResponse<String>>> futures =
                java.util.stream.IntStream.range(0, 10)
                        .mapToObj(ignored -> sendAsync(burstUri))
                        .toList();
        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();

        List<Integer> statuses = futures.stream()
                .map(CompletableFuture::join)
                .map(HttpResponse::statusCode)
                .toList();
        long accepted = statuses.stream().filter(status -> status == 200).count();
        long rateLimited = statuses.stream().filter(status -> status == 429).count();

        assertThat(statuses).allMatch(status -> status == 200 || status == 429);
        assertThat(accepted).isPositive();

        System.out.printf(
                "EN-014 live spike: peruAddresses=%d style=200 burst200=%d burst429=%d%n",
                PERU_ADDRESSES.size(),
                accepted,
                rateLimited);
    }

    private HttpResponse<String> send(URI uri) throws Exception {
        return httpClient.send(request(uri),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    }

    private CompletableFuture<HttpResponse<String>> sendAsync(URI uri) {
        return httpClient.sendAsync(request(uri),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    }

    private static HttpRequest request(URI uri) {
        return HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json")
                .GET()
                .build();
    }

    private static URI geocodingUri(String address, String apiKey) {
        return URI.create("https://api.geoapify.com/v1/geocode/search?text="
                + encode(address)
                + "&filter=countrycode:pe&limit=3&format=json&apiKey="
                + encode(apiKey));
    }

    private static URI styleUri(String apiKey) {
        return URI.create("https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey="
                + encode(apiKey));
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static void assertPeruCandidate(String body) {
        assertThat(body)
                .contains("\"results\"")
                .contains("\"country_code\":\"pe\"");

        double latitude = firstCoordinate(LATITUDE, body);
        double longitude = firstCoordinate(LONGITUDE, body);
        assertThat(latitude).isBetween(-19.0, 1.0);
        assertThat(longitude).isBetween(-82.0, -68.0);
    }

    private static double firstCoordinate(Pattern pattern, String body) {
        Matcher matcher = pattern.matcher(body);
        assertThat(matcher.find()).isTrue();
        return Double.parseDouble(matcher.group(1));
    }
}

