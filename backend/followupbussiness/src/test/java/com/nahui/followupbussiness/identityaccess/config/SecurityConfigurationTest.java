package com.nahui.followupbussiness.identityaccess.config;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.nahui.followupbussiness.outbox.application.PlatformOperator;
import com.nahui.followupbussiness.outbox.adapter.in.rest.DlqReprocessRateLimiter;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.application.LoginService;
import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryService;
import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryRequestWorker;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.application.port.in.LogoutSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.ProvisionInitialCompanyAdminUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.RefreshSessionUseCase;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.core.authority.AuthorityUtils.createAuthorityList;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "followupbussiness.security.local-secret=TEST_ONLY_NON_SECRET_012345678901234567890123456789",
        "followupbussiness.authentication.web-origin=https://localhost:5173",
        "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
        "followupbussiness.outbox.enabled=false"
})
@AutoConfigureMockMvc
@Import(SecurityConfigurationTest.TestOnlyController.class)
class SecurityConfigurationTest {

    @MockitoBean
    private com.nahui.followupbussiness.outbox.application.ReprocessOutboxEvent reprocessOutboxEvent;

    @MockitoBean
    private DlqReprocessRateLimiter dlqReprocessRateLimiter;

    @MockitoBean
    private InboundJwtAuthenticator inboundJwtAuthenticator;

    @MockitoBean
    private CompanyUserService companyUserService;

    @MockitoBean
    private LoginService loginService;

    @MockitoBean
    private ProvisionInitialCompanyAdminUseCase provisionInitialCompanyAdminUseCase;

    @MockitoBean
    private LogoutSessionUseCase logoutSessionUseCase;

    @MockitoBean
    private PasswordRecoveryService passwordRecoveryService;

    @MockitoBean
    private RefreshSessionUseCase refreshSessionUseCase;

    @MockitoBean
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private PlatformTransactionManager transactionManager;

    @MockitoBean
    private AuditEntryStore auditEntryStore;

    @MockitoBean
    private PasswordRecoveryRequestWorker passwordRecoveryRequestWorker;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext applicationContext;


    @Test
    void protectedRouteRejectsUnauthenticatedRequestWithSafe401() throws Exception {
        String responseBody = mockMvc.perform(get("/api/test/protected"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Authentication is required"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertNoInternalInformation(responseBody);
    }

    @ParameterizedTest(name = "{0} {1} remains protected")
    @MethodSource("protectedOperations")
    void noBusinessOrOperationalRouteIsPublicByAccident(HttpMethod method, String path) throws Exception {
        mockMvc.perform(request(method, path))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void forbiddenResponseDoesNotLeakInternalInformation() throws Exception {
        String responseBody = mockMvc.perform(post("/api/test/protected").with(user("test-only-user")))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Access is denied"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertNoInternalInformation(responseBody);
    }

    @Test
    void authenticatedLogoutReachesTheSessionBoundCsrfControlInsteadOfSpringCsrf() throws Exception {
        var actor = new com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor(
                java.util.UUID.randomUUID(), java.util.UUID.randomUUID(),
                com.nahui.followupbussiness.identityaccess.domain.model.BaseRole.SELLER, java.util.UUID.randomUUID());
        when(inboundJwtAuthenticator.authenticate("web-session-token")).thenReturn(
                org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated(actor, "web-session-token", createAuthorityList("SELLER")));
        mockMvc.perform(post("/auth/logout")
                        .header("Authorization", "Bearer web-session-token")
                        .header("X-CSRF-Token", "session-bound-token"))
                .andExpect(status().isNoContent());
        verify(logoutSessionUseCase).logout(org.mockito.ArgumentMatchers.argThat(command ->
                command.actor().equals(actor) && "session-bound-token".equals(command.csrfToken())));
    }

    @Test
    void applicationDoesNotCreateDefaultUsers() {
        assertThat(applicationContext.getBeansOfType(UserDetailsService.class)).isEmpty();
    }

    @Test
    void platformCompanyListingRequiresPlatformAuthority() throws Exception {
        mockMvc.perform(get("/platform/companies"))
                .andExpect(status().isUnauthorized());
        when(inboundJwtAuthenticator.authenticate("seller-token")).thenReturn(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("seller", "token", createAuthorityList("SELLER")));
        mockMvc.perform(get("/platform/companies").header("Authorization", "Bearer seller-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void authenticationCorsAllowsOnlyTheConfiguredLocalHttpsOriginWithCredentials() throws Exception {
        mockMvc.perform(options("/auth/login")
                        .header("Origin", "https://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Content-Type,X-Auth-Client,X-Client-Instance-Id"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"))
                .andExpect(header().string("Access-Control-Allow-Methods", org.hamcrest.Matchers.containsString("POST")))
                .andExpect(header().string("Access-Control-Allow-Headers", org.hamcrest.Matchers.allOf(
                        org.hamcrest.Matchers.containsString("Content-Type"),
                        org.hamcrest.Matchers.containsString("X-Auth-Client"),
                        org.hamcrest.Matchers.containsString("X-Client-Instance-Id"))));
    }

    @Test
    void authenticationCorsRejectsAnUnconfiguredOrigin() throws Exception {
        mockMvc.perform(options("/auth/login")
                        .header("Origin", "https://untrusted.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void productionBootJacksonConfigurationRejectsUnknownRequestProperties() throws Exception {
        mockMvc.perform(post("/api/test/strict-json")
                        .with(user("test-only-user"))
                        .with(csrf())
                        .contentType("application/json")
                .content("{\"name\":\"valid\",\"unexpected\":true}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dlqReprocessRequiresPlatformAuthorityAndTrustedUuidIdentity() throws Exception {
        String eventId = "00000000-0000-0000-0000-000000000001";
        String path = "/api/v1/internal/outbox/dlq/" + eventId + "/reprocess";
        mockMvc.perform(post(path)).andExpect(status().isUnauthorized());
        when(inboundJwtAuthenticator.authenticate("signed-seller-token")).thenReturn(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("operator", "token", createAuthorityList("SELLER")));
        mockMvc.perform(post(path).header("Authorization", "Bearer signed-seller-token")).andExpect(status().isForbidden());
        when(inboundJwtAuthenticator.authenticate("signed-malformed-sub-token")).thenReturn(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("not-a-uuid", "token", createAuthorityList("PLATFORM_SUPERADMIN")));
        mockMvc.perform(post(path).header("Authorization", "Bearer signed-malformed-sub-token"))
                .andExpect(status().isForbidden());
        when(reprocessOutboxEvent.execute(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(true);
        when(dlqReprocessRateLimiter.check(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(new DlqReprocessRateLimiter.Decision(true, 1));
        when(inboundJwtAuthenticator.authenticate("valid-signed-token")).thenReturn(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("00000000-0000-0000-0000-000000000002", "token", createAuthorityList("PLATFORM_SUPERADMIN")));
        mockMvc.perform(post(path).header("Authorization", "Bearer valid-signed-token"))
                .andExpect(status().isAccepted());
        verify(reprocessOutboxEvent).execute(
                java.util.UUID.fromString(eventId),
                new PlatformOperator(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"), true));
    }

    @Test
    void dlqReprocessUsesRuntimeBearerAuthenticationAndRejectsAThrottleAbuse() throws Exception {
        String eventId = "00000000-0000-0000-0000-000000000001";
        String path = "/api/v1/internal/outbox/dlq/" + eventId + "/reprocess";
        var authentication = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                "00000000-0000-0000-0000-000000000002", "token", createAuthorityList("PLATFORM_SUPERADMIN"));
        when(inboundJwtAuthenticator.authenticate("valid-signed-token")).thenReturn(authentication);
        when(dlqReprocessRateLimiter.check("00000000-0000-0000-0000-000000000002", "127.0.0.1"))
                .thenReturn(new DlqReprocessRateLimiter.Decision(false, 45));

        mockMvc.perform(post(path).header("Authorization", "Bearer valid-signed-token"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "45"));
        mockMvc.perform(post(path).header("Authorization", "Bearer altered-token"))
                .andExpect(status().isUnauthorized());
    }

    private static Stream<Arguments> protectedOperations() {
        return Stream.of(
                Arguments.of(HttpMethod.POST, "/roles"),
                Arguments.of(HttpMethod.PUT, "/roles/SELLER"),
                Arguments.of(HttpMethod.PATCH, "/roles/PLATFORM_SUPERADMIN"),
                Arguments.of(HttpMethod.POST, "/platform/superadmins/bootstrap"),
                Arguments.of(HttpMethod.GET, "/platform/companies"),
                Arguments.of(HttpMethod.GET, "/sellers"),
                Arguments.of(HttpMethod.POST, "/sellers"),
                Arguments.of(HttpMethod.GET, "/customers"),
                Arguments.of(HttpMethod.POST, "/customers"),
                Arguments.of(HttpMethod.POST, "/customers/imports"),
                Arguments.of(HttpMethod.GET, "/routes"),
                Arguments.of(HttpMethod.POST, "/routes"),
                Arguments.of(HttpMethod.POST, "/routes/00000000-0000-0000-0000-000000000000/publish"),
                Arguments.of(HttpMethod.POST, "/journeys/start"),
                Arguments.of(HttpMethod.POST, "/journeys/00000000-0000-0000-0000-000000000000/locations"),
                Arguments.of(HttpMethod.POST, "/journeys/00000000-0000-0000-0000-000000000000/close"),
                Arguments.of(HttpMethod.POST, "/visits/check-in"),
                Arguments.of(HttpMethod.POST, "/visits/00000000-0000-0000-0000-000000000000/check-out"),
                Arguments.of(HttpMethod.GET, "/sales"),
                Arguments.of(HttpMethod.POST, "/sales"),
                Arguments.of(HttpMethod.GET, "/reports/daily-dashboard"),
                Arguments.of(HttpMethod.GET, "/actuator/health"),
                Arguments.of(HttpMethod.GET, "/actuator/health/readiness"),
                Arguments.of(HttpMethod.GET, "/unmapped-route"));
    }

    private static void assertNoInternalInformation(String body) {
        assertThat(body)
                .doesNotContainIgnoringCase("exception")
                .doesNotContainIgnoringCase("stack")
                .doesNotContainIgnoringCase("trace")
                .doesNotContainIgnoringCase("secret")
                .doesNotContainIgnoringCase("password")
                .doesNotContainIgnoringCase("authorization")
                .doesNotContain("/api/");
    }

    @RestController
    static class TestOnlyController {

        @GetMapping("/api/test/protected")
        String getProtectedResource() {
            return "protected";
        }

        @PostMapping("/api/test/protected")
        String mutateProtectedResource() {
            return "protected";
        }

        @PostMapping("/api/test/strict-json")
        String strictJson(@RequestBody StrictPayload payload) {
            return payload.name();
        }

        record StrictPayload(String name) { }
    }
}
