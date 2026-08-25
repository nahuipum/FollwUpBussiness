package com.nahui.followupbussiness.tenancy.adapter.in.rest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.identityaccess.adapter.in.security.CorrelationIdFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticationFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.RestAuthenticationEntryPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.CompanySettingsService;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanySettingsUseCase;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CompanySettingsControllerTest {
    private static final String CORRELATION = "a0d0cf0e-7b8c-4143-b983-25d9e166aa30";

    @Test void getExposesQuotedCurrentVersionAsEtagForTheFollowingUpdate() throws Exception {
        CompanySettingsUseCase service = mock(CompanySettingsUseCase.class);
        when(service.get(any())).thenReturn(Optional.of(company(7)));
        fixture(service).mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/company/settings")
                        .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("ETag", "\"7\""));
    }

    @Test void updateExposesTheResultingQuotedVersionAsEtag() throws Exception {
        CompanySettingsUseCase service = mock(CompanySettingsUseCase.class);
        when(service.update(any(), any())).thenReturn(company(8));
        fixture(service).mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/company/settings")
                        .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION).header("If-Match", "\"7\"")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"timezone\":\"America/Bogota\"}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("ETag", "\"8\""));
    }

    @Test void missingActiveConfigurationIsNeutralForbiddenInsteadOfServerError() throws Exception {
        CompanySettingsUseCase service = mock(CompanySettingsUseCase.class);
        when(service.get(any())).thenReturn(Optional.empty());
        fixture(service).mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/company/settings")
                        .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("X-Correlation-Id", CORRELATION));
    }

    @Test void fixedPayloadWithStaleEtagReturns422WithoutControllerFallback() throws Exception {
        CompanySettingsUseCase service = mock(CompanySettingsUseCase.class);
        when(service.update(any(), any())).thenThrow(new CompanySettingsService.InvalidUpdateException());
        fixture(service).mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/company/settings")
                        .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION).header("If-Match", "\"1\"")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"geofenceRadiusMeters\":100}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnprocessableEntity());
    }

    @Test void absentConfigurationDuringPatchIsNeutralForbiddenInsteadOfServerError() throws Exception {
        CompanySettingsUseCase service = mock(CompanySettingsUseCase.class);
        when(service.update(any(), any())).thenThrow(new CompanySettingsService.NotFoundException());
        fixture(service).mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/company/settings")
                        .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION).header("If-Match", "\"1\"")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"timezone\":\"America/Bogota\"}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
    }

    @Test void fixedNullFieldRetainsPresenceForTheUseCase() throws Exception {
        CompanySettingsUseCase service = mock(CompanySettingsUseCase.class);
        when(service.update(any(), any())).thenThrow(new CompanySettingsService.InvalidUpdateException());
        fixture(service).mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/company/settings")
                        .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION).header("If-Match", "\"1\"")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"timezone\":\"America/Bogota\",\"geofenceRadiusMeters\":null}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnprocessableEntity());
        var command = org.mockito.ArgumentCaptor.forClass(CompanySettingsUseCase.Update.class);
        verify(service).update(command.capture(), any());
        org.assertj.core.api.Assertions.assertThat(command.getValue().geofenceRadiusPresent()).isTrue();
    }

    @Test void adapterGeneratedRejectionsIncrementTheSafeCounterOnce() throws Exception {
        CompanySettingsUseCase service = mock(CompanySettingsUseCase.class);
        Fixture bodyEmpty = fixture(service);
        bodyEmpty.mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/company/settings")
                        .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION).header("If-Match", "\"1\"")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnprocessableEntity());
        verify(bodyEmpty.rejected()).increment(); verifyNoInteractions(service);

        Fixture invalidEtag = fixture(mock(CompanySettingsUseCase.class));
        invalidEtag.mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/company/settings")
                        .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION).header("If-Match", "wrong")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"timezone\":\"America/Bogota\"}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnprocessableEntity());
        verify(invalidEtag.rejected()).increment();

        Fixture unreadable = fixture(mock(CompanySettingsUseCase.class));
        unreadable.mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/company/settings")
                        .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION).header("If-Match", "\"1\"")
                        .contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnprocessableEntity());
        verify(unreadable.rejected()).increment();
    }

    @Test void saleEditWindowRejectsNonIntegralNullAndOutOfRangeNodesWithoutEffects() throws Exception {
        for (String invalid : List.of("1.9", "null", "\"60\"", "true", "{}", "[]", "-1", "10081")) {
            CompanySettingsUseCase service = mock(CompanySettingsUseCase.class);
            Fixture fixture = fixture(service);
            fixture.mvc().perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/company/settings")
                            .header("Authorization", "Bearer valid").header("X-Correlation-Id", CORRELATION).header("If-Match", "\"1\"")
                            .contentType(MediaType.APPLICATION_JSON).content("{\"saleEditWindowMinutes\":" + invalid + "}"))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnprocessableEntity());
            verify(fixture.rejected()).increment();
            verifyNoInteractions(service);
        }
    }

    private static Fixture fixture(CompanySettingsUseCase service) {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        MeterRegistry meters = mock(MeterRegistry.class);
        Counter rejected = mock(Counter.class);
        when(meters.counter("company.settings.rejected")).thenReturn(rejected);
        when(authenticator.authenticate("valid")).thenReturn(UsernamePasswordAuthenticationToken.authenticated(
                new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), "valid", List.of()));
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new CompanySettingsController(service, meters))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .addFilters(new CorrelationIdFilter(), new InboundJwtAuthenticationFilter(authenticator, new RestAuthenticationEntryPoint())).build();
        return new Fixture(mvc, rejected);
    }

    private static Company company(long version) {
        return new Company(UUID.randomUUID(), "Nahui SAC", null, "NAHUI", null, CompanyStatus.ACTIVE,
                new CompanySettings("America/Lima", "PEN", 100, 60, 90, 60), Instant.now(), Instant.now(), version);
    }

    private record Fixture(MockMvc mvc, Counter rejected) { }
}
