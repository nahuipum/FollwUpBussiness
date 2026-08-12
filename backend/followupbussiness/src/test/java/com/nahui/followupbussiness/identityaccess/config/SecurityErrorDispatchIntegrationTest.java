package com.nahui.followupbussiness.identityaccess.config;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.core.authority.AuthorityUtils.createAuthorityList;

import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.application.LoginService;
import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryService;
import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryRequestWorker;
import com.nahui.followupbussiness.identityaccess.application.port.in.LogoutSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.ProvisionInitialCompanyAdminUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.RefreshSessionUseCase;
import com.nahui.followupbussiness.outbox.adapter.in.rest.DlqReprocessRateLimiter;
import com.nahui.followupbussiness.outbox.application.ReprocessOutboxEvent;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "followupbussiness.security.local-secret=TEST_ONLY_NON_SECRET_012345678901234567890123456789",
        "followupbussiness.authentication.web-origin=https://localhost:5173",
        "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
        "followupbussiness.outbox.enabled=false"
})
class SecurityErrorDispatchIntegrationTest {

    @MockitoBean private ReprocessOutboxEvent reprocessOutboxEvent;
    @MockitoBean private DlqReprocessRateLimiter dlqReprocessRateLimiter;
    @MockitoBean private InboundJwtAuthenticator inboundJwtAuthenticator;
    @MockitoBean private CompanyUserService companyUserService;
    @MockitoBean private LoginService loginService;
    @MockitoBean private ProvisionInitialCompanyAdminUseCase provisionInitialCompanyAdminUseCase;
    @MockitoBean private LogoutSessionUseCase logoutSessionUseCase;
    @MockitoBean private PasswordRecoveryService passwordRecoveryService;
    @MockitoBean private RefreshSessionUseCase refreshSessionUseCase;
    @MockitoBean private JdbcTemplate jdbcTemplate;
    @MockitoBean private PlatformTransactionManager transactionManager;
    @MockitoBean private AuditEntryStore auditEntryStore;
    @MockitoBean private PasswordRecoveryRequestWorker passwordRecoveryRequestWorker;

    @LocalServerPort
    private int port;

    @Test
    void authenticatedRequestToAnUnmappedRouteRemainsNotFoundAfterErrorDispatch() throws Exception {
        when(inboundJwtAuthenticator.authenticate("valid-token")).thenReturn(
                new UsernamePasswordAuthenticationToken("test-only-subject", "ignored", createAuthorityList("PLATFORM_SUPERADMIN")));

        HttpResponse<Void> response = HttpClient.newHttpClient().send(HttpRequest.newBuilder(
                        URI.create("http://localhost:" + port + "/platform/not-mapped"))
                .header("Authorization", "Bearer valid-token")
                .GET()
                .build(), HttpResponse.BodyHandlers.discarding());

        assertThat(response.statusCode()).isEqualTo(404);
    }

    @Test
    void unauthenticatedRequestToTheSameRouteRemainsUnauthorized() throws Exception {
        HttpResponse<Void> response = HttpClient.newHttpClient().send(HttpRequest.newBuilder(
                        URI.create("http://localhost:" + port + "/platform/not-mapped"))
                .GET()
                .build(), HttpResponse.BodyHandlers.discarding());

        assertThat(response.statusCode()).isEqualTo(401);
    }
}
