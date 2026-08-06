package com.nahui.followupbussiness.tenancy.adapter.in.rest;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticationFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.RestAuthenticationEntryPoint;
import com.nahui.followupbussiness.audit.adapter.out.security.SecurityContextPlatformAuditTrustedContextProvider;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.CreateCompanyUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.ChangeCompanyStatusUseCase;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.util.List;
import java.util.UUID;
import java.time.Clock;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CompanyControllerTest {
    @Test void statusTransitionReturnsTheContractCompanyAndCorrelation() throws Exception {
        UUID companyId = UUID.randomUUID();
        ChangeCompanyStatusUseCase statusUseCase = (id, command, actor) -> ChangeCompanyStatusUseCase.Result.success(company(companyId, command.status()));
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), statusUseCase, platform());
        mvc.perform(patch("/platform/companies/{companyId}/status", companyId).header("Authorization", "Bearer valid")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"SUSPENDED\",\"reason\":\"Operational review\"}"))
                .andExpect(status().isOk()).andExpect(header().exists("X-Correlation-Id"))
                .andExpect(jsonPath("$.id").value(companyId.toString())).andExpect(jsonPath("$.status").value("SUSPENDED"));
    }
    @Test void unknownCompanyKeepsTheNeutral404Contract() throws Exception {
        ChangeCompanyStatusUseCase statusUseCase = (id, command, actor) -> ChangeCompanyStatusUseCase.Result.notFound();
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), statusUseCase, platform());
        mvc.perform(patch("/platform/companies/{companyId}/status", UUID.randomUUID()).header("Authorization", "Bearer valid")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ACTIVE\",\"reason\":\"Operational review\"}"))
                .andExpect(status().isNotFound()).andExpect(header().string("Cache-Control", "no-store"));
    }
    @Test void invalidStatusReasonIsRejectedBeforeTheUseCase() throws Exception {
        ChangeCompanyStatusUseCase statusUseCase = mock(ChangeCompanyStatusUseCase.class);
        MockMvc mvc = mvc(mock(CreateCompanyUseCase.class), statusUseCase, platform());
        mvc.perform(patch("/platform/companies/{companyId}/status", UUID.randomUUID()).header("Authorization", "Bearer valid")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ACTIVE\",\"reason\":\"no\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(statusUseCase);
    }
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
        ChangeCompanyStatusUseCase statusUseCase = mock(ChangeCompanyStatusUseCase.class);
        return mvc(useCase, statusUseCase, actor);
    }
    private static MockMvc mvc(CreateCompanyUseCase useCase, ChangeCompanyStatusUseCase statusUseCase, AuthenticatedActor actor) {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        when(authenticator.authenticate("valid")).thenReturn(UsernamePasswordAuthenticationToken.authenticated(actor, "valid", List.of()));
        return MockMvcBuilders.standaloneSetup(new CompanyController(useCase, statusUseCase)).setControllerAdvice(new CompanyValidationErrorHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .addFilters(new InboundJwtAuthenticationFilter(authenticator, new RestAuthenticationEntryPoint())).build();
    }
    private static AuthenticatedActor platform() { return new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN); }
    private static Company company(UUID id, CompanyStatus status) {
        return new Company(id, "Nahui SAC", null, "NAHUI", null, status,
                new CompanySettings("America/Lima", "PEN", 100, 60, 90, null), Instant.EPOCH, Instant.EPOCH, 2);
    }
    private static String validBody() { return "{\"legalName\":\"Nahui SAC\",\"code\":\"NAHUI\",\"settings\":{\"timezone\":\"America/Lima\",\"currency\":\"PEN\",\"geofenceRadiusMeters\":100,\"trackingIntervalSeconds\":60}}"; }
}
