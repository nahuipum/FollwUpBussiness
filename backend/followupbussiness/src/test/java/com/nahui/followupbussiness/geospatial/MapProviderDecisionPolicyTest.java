package com.nahui.followupbussiness.geospatial;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class MapProviderDecisionPolicyTest {

    private static final Path REPOSITORY_ROOT = repositoryRoot();

    @Test
    void decisionSeparatesCapabilitiesAndKeepsPostgisAuthoritative() throws IOException {
        String adr = read("docs/architecture/adr/ADR-013-mapas-geocodificacion-navegacion.md");
        String policy = read("docs/architecture/maps/EN-014-capability-policy.md");

        assertThat(adr)
                .contains("renderer:** MapLibre")
                .contains("tiles/style:** Geoapify")
                .contains("geocoder:** Geoapify")
                .contains("navigation launcher:** URL externa")
                .contains("geospatial authority:** PostGIS")
                .contains("route engine:** no decidido aquí")
                .contains("Powered by Geoapify | © OpenStreetMap contributors")
                .contains("no implementa endpoints, adaptadores ni configuración runtime");
        assertThat(policy)
                .contains("GeoPoint")
                .contains("srid: 4326")
                .contains("No se exponen objetos MapLibre, Geoapify, Google, Waze o Mapbox")
                .contains("no implementa endpoints");
    }

    @Test
    void quotaAndZeroCostAssumptionsAreBounded() throws IOException {
        String adr = read("docs/architecture/adr/ADR-013-mapas-geocodificacion-navegacion.md");
        String policy = read("docs/architecture/maps/EN-014-capability-policy.md");

        assertThat(adr)
                .contains("3,000 créditos por día")
                .contains("5 solicitudes por segundo")
                .contains("| Total estimado | 500 + 100 | 600 |")
                .contains("70% (2,100 créditos)")
                .contains("85% (2,550)")
                .contains("95% (2,850)")
                .contains("no incluye ingeniería, infraestructura propia ni costo")
                .contains("no exige tarjeta");
        assertThat(policy)
                .contains("Presupuesto de planificación: 600 créditos/día/empresa")
                .contains("Límite de proveedor: 5 solicitudes/segundo");
    }

    @Test
    void dataPolicyMinimizesDisclosureAndPreservesTenantIsolation() throws IOException {
        String adr = read("docs/architecture/adr/ADR-013-mapas-geocodificacion-navegacion.md");
        String policy = read("docs/architecture/maps/EN-014-capability-policy.md");

        assertThat(adr)
                .contains("No")
                .contains("`tenantId`, `customerId`, `sellerId`")
                .contains("No se usarán direcciones")
                .contains("tenant para responder solicitudes de otro tenant")
                .contains("Cache, rate limits y métricas quedan segregados por tenant")
                .contains("Los logs no")
                .contains("coordenadas completas")
                .contains("token público de")
                .contains("mínimo privilegio, no como secreto")
                .contains("La clave de geocodificación será solo server-side");
        assertThat(policy)
                .contains("deriva tenant y usuario de la sesión")
                .contains("No existe aceptación automática")
                .contains("prueba negativa de acceso entre tenants");
    }

    @Test
    void degradationRotationAndRollbackRemainIndependent() throws IOException {
        String adr = read("docs/architecture/adr/ADR-013-mapas-geocodificacion-navegacion.md");
        String policy = read("docs/architecture/maps/EN-014-capability-policy.md");

        assertThat(adr)
                .contains("Se conserva captura manual")
                .contains("Lista/tabla accesible")
                .contains("crear, restringir, probar, activar, observar")
                .contains("apagar `geocodingEnabled`")
                .contains("Las coordenadas confirmadas permanecen en PostGIS")
                .contains("no se geocodifican de")
                .contains("nuevo al cambiar proveedor");
        assertThat(policy)
                .contains("Mapa | tiles y capas disponibles")
                .contains("Geocoder | búsqueda controlada")
                .contains("Navegación | app preferida disponible")
                .contains("se activa automáticamente");
    }

    @Test
    void alternativesAndReevaluationPreventSilentLockIn() throws IOException {
        String adr = read("docs/architecture/adr/ADR-013-mapas-geocodificacion-navegacion.md");

        assertThat(adr)
                .contains("Google completo")
                .contains("Mapbox completo")
                .contains("OSM autogestionado")
                .contains("cache")
                .contains("30 días")
                .contains("Permanent Geocoding cuesta desde la primera solicitud")
                .contains("Nominatim público limita a 1 solicitud por segundo")
                .contains("consumo sostenido superior a 2,100 créditos/día")
                .contains("cambio de licencia, cuota, precio o condiciones comerciales")
                .contains("https://www.geoapify.com/pricing/")
                .contains("https://www.geoapify.com/terms-and-conditions/");
    }

    private static String read(String relativePath) throws IOException {
        return Files.readString(REPOSITORY_ROOT.resolve(relativePath), StandardCharsets.UTF_8);
    }

    private static Path repositoryRoot() {
        Path candidate = Path.of("").toAbsolutePath();
        while (candidate != null && !Files.isDirectory(candidate.resolve(".git"))) {
            candidate = candidate.getParent();
        }
        if (candidate == null) {
            throw new IllegalStateException("Git repository root was not found");
        }
        return candidate;
    }
}

