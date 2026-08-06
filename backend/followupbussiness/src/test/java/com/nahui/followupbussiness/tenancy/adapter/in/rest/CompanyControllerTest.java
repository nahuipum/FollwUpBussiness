package com.nahui.followupbussiness.tenancy.adapter.in.rest;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticationFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.RestAuthenticationEntryPoint;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextPlatformAuditTrustedContextProvider;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.CreateCompanyUseCase;
import java.util.List;
import java.util.UUID;
import java.time.Clock;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CompanyControllerTest {
    @Test void invalidCorrelationIsNotReflectedAndConflictIsNeutral() throws Exception {
        CreateCompanyUseCase useCase = mock(CreateCompanyUseCase.class);
        when(useCase.execute(any(), any())).thenReturn(CreateCompanyUseCase.Result.conflictResult());
        MockMvc mvc = mvc(useCase, platform());
        mvc.perform(post("/platform/companies").header("Authorization", "Bearer valid").header("X-Correlation-Id", "not-a-uuid")
                        .contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isConflict()).andExpect(header().exists("X-Correlation-Id"))
                .andExpect(header().string("Cache-Control", "no-store")).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("not-a-uuid"))));
    }
    @Test void invalidCorrelationIsNormalizedOnceForResponseAndPlatformAuditContext() throws Exception {
        AtomicReference<UUID> auditCorrelation = new AtomicReference<>();
        var provider = new SecurityContextPlatformAuditTrustedContextProvider(Clock.systemUTC());
        CreateCompanyUseCase useCase = (command, actor) -> {
            auditCorrelation.set(provider.current().correlationId());
            return CreateCompanyUseCase.Result.conflictResult();
        };
        MockMvc mvc = mvc(useCase, platform());
        var result = mvc.perform(post("/platform/companies").header("Authorization", "Bearer valid").header("X-Correlation-Id", "not-a-uuid")
                        .contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isConflict()).andExpect(header().exists("X-Correlation-Id"))
                .andReturn();
        org.assertj.core.api.Assertions.assertThat(result.getResponse().getHeader("X-Correlation-Id"))
                .isEqualTo(auditCorrelation.get().toString());
    }
    @Test void companyBoundPlatformRoleIsRejectedByUseCaseBeforePersistence() throws Exception {
        CreateCompanyUseCase useCase = mock(CreateCompanyUseCase.class);
        when(useCase.execute(any(), any())).thenThrow(new com.nahui.followupbussiness.tenancy.application.CreateCompanyService.AccessDeniedException());
        MockMvc mvc = mvc(useCase, new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN));
        mvc.perform(post("/platform/companies").header("Authorization", "Bearer valid").contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isForbidden()).andExpect(header().exists("X-Correlation-Id"));
    }
    private static MockMvc mvc(CreateCompanyUseCase useCase, AuthenticatedActor actor) {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        when(authenticator.authenticate("valid")).thenReturn(UsernamePasswordAuthenticationToken.authenticated(actor, "valid", List.of()));
        return MockMvcBuilders.standaloneSetup(new CompanyController(useCase)).setControllerAdvice(new CompanyValidationErrorHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .addFilters(new InboundJwtAuthenticationFilter(authenticator, new RestAuthenticationEntryPoint())).build();
    }
    private static AuthenticatedActor platform() { return new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN); }
    private static String validBody() { return "{\"legalName\":\"Nahui SAC\",\"code\":\"NAHUI\",\"settings\":{\"timezone\":\"America/Lima\",\"currency\":\"PEN\",\"geofenceRadiusMeters\":100,\"trackingIntervalSeconds\":60}}"; }
}
