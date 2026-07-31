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
                .contains("Redis solo acelera tombstones de sesión y rate limits")
                .contains("nunca respuestas positivas `ACTIVE`")
                .contains("consulta su fila de familia, cuenta y tenant en cada aceptación de access");
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
                .contains("sessionRevocationTicket:")
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
                .contains("PASSWORD_POLICY_VIOLATION")
                .contains("ACCESS_TOKEN_EXPIRED")
                .contains("SESSION_REVOKED");
        assertThat(recovery.replaceAll("\\s+", " "))
                .contains("Siempre responde el mismo 202")
                .contains("no devuelve token ni estado de cuenta")
                .doesNotContain("'404'")
                .doesNotContain("'401'");
    }

    @Test
    void authenticationAbuseControlsAreCanonicalizedAndCannotBlockDefensiveLogout() throws IOException {
        String adr = read("docs/architecture/adr/ADR-008-autenticacion-sesiones.md");
        String openApi = read("docs/api/openapi.yaml");
        String logout = section(openApi, "  /auth/logout:", "  /auth/password-recovery-requests:");
        String reset = section(openApi, "  /auth/password-resets:", "  /me:");
        String passwordPolicyViolation = section(openApi,
                "    PasswordPolicyViolation:",
                "    LocationBatchConflict:");

        assertThat(adr.replaceAll("\\s+", " "))
                .contains("5/15 min por identificador canónico independiente de IP")
                .contains("se aplica también a entradas inexistentes")
                .contains("para token/familia desconocidos, 30/min por digest presentado+IP y 120/min por IP")
                .contains("El servidor nunca devuelve `429` ni omite una revocación por cuota")
                .contains("MOBILE detiene rastreo y elimina access/refresh de secure storage")
                .contains("responde antes de buscar una cuenta, crear un token o invocar una notificación");
        assertThat(logout.replaceAll("\\s+", " "))
                .contains("La revocación no se rechaza por rate limit")
                .contains("X-Logout-Intent: PENDING")
                .contains("X-Session-Revocation-Ticket")
                .doesNotContain("'429'");
        assertThat(reset).contains("PasswordPolicyViolation");
        assertThat(passwordPolicyViolation).contains("PASSWORD_POLICY_VIOLATION");
    }

    @Test
    void offlineLogoutRetainsOnlyRevocationCapabilityAndWebCookieIsServerCleared() throws IOException {
        String adr = read("docs/architecture/adr/ADR-008-autenticacion-sesiones.md")
                .replaceAll("\\s+", " ");
        String openApi = read("docs/api/openapi.yaml");
        String logout = section(openApi, "  /auth/logout:", "  /auth/password-recovery-requests:")
                .replaceAll("\\s+", " ");
        String mobileResponse = section(openApi,
                "    MobileAuthenticationResponse:",
                "    UserSummary:");

        assertThat(adr)
                .contains("JavaScript no puede borrar `__Host-fs-refresh` por ser HttpOnly")
                .contains("Set-Cookie ... Max-Age=0")
                .contains("Conserva únicamente un `sessionRevocationTicket` opaco de 32 bytes")
                .contains("No autentica, no permite refresh")
                .contains("X-Logout-Intent: PENDING")
                .contains("Esta forma no admite cookie, access ni `allSessions=true`");
        assertThat(adr)
                .contains("X-Logout-Intent` y `X-Correlation-Id")
                .contains("preflight del cierre WEB pendiente permite `X-Logout-Intent` solo para el Origin exacto aprobado");
        assertThat(logout)
                .contains("WEB sin access reintenta solo con cookie HttpOnly")
                .contains("X-Logout-Intent: PENDING")
                .contains("X-Session-Revocation-Ticket")
                .contains("preflight CORS permite X-Logout-Intent solo para ese Origin y POST /auth/logout")
                .doesNotContain("'429'");
        assertThat(mobileResponse)
                .contains("sessionRevocationTicket:")
                .contains("no sirve para autenticar ni renovar");
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
