package com.nahui.followupbussiness.routing;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class RouteEngineDecisionPolicyTest {
    private static final Path ROOT = repositoryRoot();

    @Test
    void decisionCoversContractWithoutProviderTypes() throws IOException {
        String adr = read("docs/architecture/adr/ADR-014-motor-rutas-limites-mvp.md");
        String policy = read("docs/architecture/routing/EN-018-route-engine-policy.md");
        assertThat(adr)
                .contains("OR-Tools", "Mapbox Matrix API", "Horario del vendedor")
                .contains("Ventanas de cliente", "Prioridad", "mapbox/driving-traffic")
                .contains("BE-022, FE-016");
        assertThat(policy)
                .contains("RouteProposalRequest", "TravelMatrix")
                .contains("No se exponen clases de OR-Tools, Mapbox, Geoapify u OSRM")
                .contains("El proveedor no recibe `tenantId`");
    }

    @Test
    void quotaAndFallbackAreBounded() throws IOException {
        String adr = read("docs/architecture/adr/ADR-014-motor-rutas-limites-mvp.md");
        String policy = read("docs/architecture/routing/EN-018-route-engine-policy.md");
        assertThat(11 * 11 * 30 * 22).isEqualTo(79_860);
        assertThat((100_000 - 79_860) / 121).isEqualTo(166);
        assertThat(adr)
                .contains("79,860 elementos/mes", "20,140 elementos de margen")
                .contains("35 matrices/día", "95% (95,000)")
                .contains("planificación y reordenamiento manual", "nunca proveedor oculto");
        assertThat(policy)
                .contains("121 elementos por matriz máxima 11×11")
                .contains("79,860 elementos/mes", "35 matrices/día")
                .contains("No existe fallback automático a otro tercero");
    }

    @Test
    void versioningSecurityAndAlternativesAreExplicit() throws IOException {
        String adr = read("docs/architecture/adr/ADR-014-motor-rutas-limites-mvp.md");
        String policy = read("docs/architecture/routing/EN-018-route-engine-policy.md");
        assertThat(adr)
                .contains("proposalVersion", "matriz normalizada", "MANUAL_EDIT")
                .contains("nunca se sobrescribe al regenerar")
                .contains("tenant y permisos se derivan de sesión")
                .contains("token es secreto server-side", "no contienen coordenadas completas")
                .contains("Mapbox Optimization API v1", "Google Route Optimization")
                .contains("OSRM autogestionado", "OR-Tools con matriz neutral")
                .contains("reemplazar Mapbox Matrix por OSRM");
        assertThat(policy)
                .contains("El orden automático original es inmutable")
                .contains("no se hace last-write-wins")
                .contains("cache/rate limit/locks segregados por tenant")
                .contains("cross-tenant", "correlationId");
    }

    @Test
    void openApiOptimizationContractMatchesDecision() throws IOException {
        String openApi = read("docs/api/openapi.yaml");
        String operation = section(openApi, "  /routes/optimize:",
                "  /routes/{routeId}/points/order:");
        String schemas = section(openApi, "    OptimizeRouteRequest:",
                "    ReorderRoutePointsRequest:");
        String requestSchema = section(openApi, "    OptimizeRouteRequest:",
                "    TimeWindow:");
        String responseSchema = section(openApi, "    OptimizeRouteResponse:",
                "    OptimizedRouteVisit:");

        assertThat(operation)
                .contains("x-story-ids: [EN-018, BE-022, FE-016, INT-008]")
                .contains("$ref: '#/components/schemas/OptimizeRouteRequest'")
                .contains("$ref: '#/components/schemas/OptimizeRouteResponse'")
                .contains("'409': { $ref: '#/components/responses/Conflict' }")
                .contains("'503': { $ref: '#/components/responses/RouteOptimizationUnavailable' }");
        assertThat(requestSchema)
                .contains("- routeId", "routeId: { type: string, format: uuid }");
        assertThat(responseSchema)
                .contains("- routeId", "routeId: { type: string, format: uuid }");
        assertThat(schemas)
                .contains("OptimizeRouteRequest:", "TimeWindow:", "OptimizeRouteVisitRequest:")
                .contains("- routeId", "- territoryId", "- startLocation", "- endLocation")
                .contains("routeId: { type: string, format: uuid }")
                .contains("- availability", "- baseRouteVersion", "- visits")
                .contains("maxItems: 9", "serviceDurationSeconds", "minimum: 1")
                .contains("windows:", "Ventanas duras")
                .contains("proposalVersion", "published:", "const: false")
                .contains("orderedVisits", "unassignedVisits")
                .contains("totalTravelSeconds", "totalServiceSeconds", "totalDistanceMeters")
                .contains("enum: [FEASIBLE, OPTIMAL, TIME_LIMIT]")
                .contains("enum: [OUTSIDE_SHIFT, TIME_WINDOW_CONFLICT, UNREACHABLE, LIMIT_EXCEEDED]")
                .doesNotContain("customerIds:", "maxItems: 500");
    }

    @Test
    void publishedEventAndMobileVersionRemainCompatible() throws IOException {
        String eventCatalog = read("docs/events/event-catalog.yaml");
        String openApi = read("docs/api/openapi.yaml");
        String policy = read("docs/architecture/routing/EN-018-route-engine-policy.md");

        assertThat(eventCatalog)
                .containsSubsequence("name: route.published", "version: 1", "owner: routing");
        assertThat(openApi)
                .contains("required: [id, date, sellerId, status, points, createdAt, updatedAt, version]")
                .contains("routes:", "items: { $ref: '#/components/schemas/Route' }");
        assertThat(policy)
                .contains("propuesta no publicada y por tanto no emite ese evento")
                .contains("Mobile continúa consumiendo", "Route.version")
                .contains("No se requiere modificar", "contrato sync para EN-018");
    }
    @Test
    void ortoolsRemainsTestScopedUntilBe022() throws IOException {
        String pom = read("backend/followupbussiness/pom.xml");
        assertThat(pom)
                .contains("<ortools.version>9.15.6755</ortools.version>")
                .containsSubsequence("<artifactId>ortools-java</artifactId>",
                        "<version>${ortools.version}</version>", "<scope>test</scope>");
    }

    private static String section(String content, String start, String end) {
        int startIndex = content.indexOf(start);
        int endIndex = content.indexOf(end, startIndex + start.length());
        if (startIndex < 0 || endIndex < 0) {
            throw new IllegalArgumentException("Contract section not found: " + start);
        }
        return content.substring(startIndex, endIndex);
    }
    private static String read(String path) throws IOException {
        return Files.readString(ROOT.resolve(path), StandardCharsets.UTF_8);
    }

    private static Path repositoryRoot() {
        Path candidate = Path.of("").toAbsolutePath();
        while (candidate != null && !Files.isDirectory(candidate.resolve(".git"))) {
            candidate = candidate.getParent();
        }
        if (candidate == null) throw new IllegalStateException();
        return candidate;
    }
}
