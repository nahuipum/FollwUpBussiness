package com.nahui.followupbussiness.identityaccess;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class AuthenticationContractPolicyTest {

    private static final Path REPOSITORY_ROOT = repositoryRoot();

    @Test
    void adrDefinesCredentialLifetimesRotationAndImmediateRevocation() throws IOException {
        String adr = read("docs/architecture/adr/ADR-008-autenticacion-sesiones.md");

        assertThat(adr)
                .contains("JWT firmado asimétricamente con `RS256`")
                .contains("duración exacta: 10 minutos")
                .contains("expiración absoluta de 30 días")
                .contains("409 REFRESH_ALREADY_ROTATED")
                .contains("401 REFRESH_TOKEN_REUSED")
                .contains("revoca toda la familia")
                .contains("la revocación no espera los 10 minutos de expiración")
                .contains("PostgreSQL es la fuente de verdad")
                .contains("Redis solo acelera estado de sesión y rate limits");
    }

    @Test
    void browserContextCannotDowngradeToMobileRefreshDelivery() throws IOException {
        String adr = read("docs/architecture/adr/ADR-008-autenticacion-sesiones.md");
        String openApi = read("docs/api/openapi.yaml");
        String refreshOperation = section(openApi, "  /auth/refresh:", "  /auth/logout:");
        String authClientParameter = section(openApi, "    AuthClient:", "    ClientInstanceId:");

        assertThat(adr)
                .contains("cualquier petición con `Origin` se trata exclusivamente como navegador")
                .contains("`MOBILE` solo se admite sin contexto de navegador")
                .contains("un refresh web presentado en body nunca se acepta como mobile")
                .contains("una cookie web nunca produce una respuesta mobile");
        assertThat(refreshOperation)
                .contains("webRefreshCookie: []")
                .contains("MobileRefreshSessionRequest")
                .contains("Origin o Sec-Fetch con MOBILE se rechaza")
                .contains("canjear una cookie web");
        assertThat(authClientParameter)
                .contains("WEB requiere Origin allowlisted")
                .contains("MOBILE requiere ausencia de Origin y Sec-Fetch")
                .contains("obtener un refresh en el body");
    }

    @Test
    void webResponseSchemaNeverExposesRefreshTokenToJavaScript() throws IOException {
        String openApi = read("docs/api/openapi.yaml");
        String webResponse = section(openApi,
                "    WebAuthenticationResponse:",
                "    MobileAuthenticationResponse:");
        String mobileResponse = section(openApi,
                "    MobileAuthenticationResponse:",
                "    UserSummary:");

        assertThat(openApi)
                .contains("name: __Host-fs-refresh")
                .contains("Secure; HttpOnly; SameSite=Strict")
                .contains("X-CSRF-Token");
        assertThat(webResponse)
                .contains("const: WEB")
                .contains("csrfToken:")
                .doesNotContain("refreshToken:");
        assertThat(mobileResponse)
                .contains("const: MOBILE")
                .contains("refreshToken:")
                .contains("secure storage móvil")
                .doesNotContain("csrfToken:");
    }

    @Test
    void refreshAndResetErrorsAreMachineDistinguishableWithoutAccountEnumeration() throws IOException {
        String openApi = read("docs/api/openapi.yaml");
        String recovery = section(openApi,
                "  /auth/password-recovery-requests:",
                "  /auth/password-resets:");

        assertThat(openApi)
                .contains("REFRESH_TOKEN_EXPIRED")
                .contains("REFRESH_TOKEN_INVALID")
                .contains("REFRESH_TOKEN_REUSED")
                .contains("REFRESH_ALREADY_ROTATED")
                .contains("PASSWORD_RESET_TOKEN_INVALID")
                .contains("PASSWORD_RESET_TOKEN_EXPIRED")
                .contains("ACCESS_TOKEN_EXPIRED")
                .contains("SESSION_REVOKED");
        assertThat(recovery)
                .contains("Siempre responde el mismo 202")
                .contains("No devuelve token ni estado de cuenta")
                .doesNotContain("'404'")
                .doesNotContain("'401'");
    }

    @Test
    void firstAccessHasNoPublicRegistrationOrDefaultPassword() throws IOException {
        String adr = read("docs/architecture/adr/ADR-008-autenticacion-sesiones.md");
        String openApi = read("docs/api/openapi.yaml");

        assertThat(adr)
                .contains("No existe `/register`, registro público, contraseña predeterminada")
                .contains("propósito persistido `ACTIVATION` y expiración de 24 horas")
                .contains("tiene propósito `PASSWORD_RESET`")
                .contains("expira exactamente a los 30 minutos")
                .contains("es de un solo uso")
                .contains("revoca todas las familias web/mobile");
        assertThat(openApi).doesNotContain("  /register:", "  /auth/register:");
    }

    private static String read(String relativePath) throws IOException {
        return Files.readString(REPOSITORY_ROOT.resolve(relativePath), StandardCharsets.UTF_8);
    }

    private static String section(String text, String start, String end) {
        int startIndex = text.indexOf(start);
        int endIndex = text.indexOf(end, startIndex + start.length());
        assertThat(startIndex).as("section start %s", start).isGreaterThanOrEqualTo(0);
        assertThat(endIndex).as("section end %s", end).isGreaterThan(startIndex);
        return text.substring(startIndex, endIndex);
    }

    private static Path repositoryRoot() {
        Path candidate = Path.of("").toAbsolutePath();
        while (candidate != null && !Files.exists(candidate.resolve(".git"))) {
            candidate = candidate.getParent();
        }
        if (candidate == null) {
            throw new IllegalStateException("Git repository root was not found");
        }
        return candidate;
    }
}
