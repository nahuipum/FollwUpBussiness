package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticationFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.RestAuthenticationEntryPoint;
import com.nahui.followupbussiness.identityaccess.application.port.out.LoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CurrentUserControllerTest {
    @Test
    void anonymousAndInvalidSessionsReceiveUnauthorizedOverHttp() throws Exception {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        when(authenticator.authenticate("revoked")).thenThrow(new InboundJwtAuthenticator.JwtValidationException());
        when(authenticator.authenticate("blocked")).thenThrow(new InboundJwtAuthenticator.JwtValidationException());
        when(authenticator.authenticate("suspended")).thenThrow(new InboundJwtAuthenticator.JwtValidationException());
        MockMvc mvc = mvc(authenticator, mock(LoginAccountQuery.class), id -> Optional.empty());

        mvc.perform(get("/me")).andExpect(status().isUnauthorized());
        for (String token : List.of("revoked", "blocked", "suspended")) {
            mvc.perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void eachTenantRoleReceivesOnlyItsOwnActiveCompanyOverHttp() throws Exception {
        for (BaseRole role : List.of(BaseRole.COMPANY_ADMIN, BaseRole.SUPERVISOR, BaseRole.SELLER)) {
            UUID accountId = UUID.randomUUID();
            UUID companyId = UUID.randomUUID();
            var actor = new AuthenticatedActor(accountId, companyId, role, UUID.randomUUID());
            LoginAccountQuery accounts = mock(LoginAccountQuery.class);
            when(accounts.findById(accountId)).thenReturn(Optional.of(new LoginAccountQuery.Account(accountId, "hash", role,
                    companyId, "ACTIVE", "User", "user@example.test")));
            InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
            when(authenticator.authenticate(role.code())).thenReturn(UsernamePasswordAuthenticationToken.authenticated(actor,
                    role.code(), List.of()));
            MockMvc mvc = mvc(authenticator, accounts, id -> Optional.of(company(companyId)));

            mvc.perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + role.code()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.roles[0]").value(role.code()))
                    .andExpect(jsonPath("$.company.id").value(companyId.toString()));
        }
    }

    @Test
    void actorWithDiscordantTenantIsRejectedBeforeAnyCompanyIsReadOverHttp() throws Exception {
        UUID accountId = UUID.randomUUID();
        UUID persistedCompanyId = UUID.randomUUID();
        UUID discordantTenantId = UUID.randomUUID();
        var actor = new AuthenticatedActor(accountId, discordantTenantId, BaseRole.SELLER, UUID.randomUUID());
        LoginAccountQuery accounts = mock(LoginAccountQuery.class);
        when(accounts.findById(accountId)).thenReturn(Optional.of(new LoginAccountQuery.Account(accountId, "hash",
                BaseRole.SELLER, persistedCompanyId, "ACTIVE", "User", "user@example.test")));
        var companies = mock(com.nahui.followupbussiness.tenancy.application.port.in.CurrentCompanyQuery.class);
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        when(authenticator.authenticate("discordant")).thenReturn(UsernamePasswordAuthenticationToken.authenticated(actor,
                "discordant", List.of()));

        mvc(authenticator, accounts, companies).perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer discordant"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_FAILED"));

        verifyNoInteractions(companies);
    }

    private static MockMvc mvc(InboundJwtAuthenticator authenticator, LoginAccountQuery accounts,
                               com.nahui.followupbussiness.tenancy.application.port.in.CurrentCompanyQuery companies) {
        return MockMvcBuilders.standaloneSetup(new CurrentUserController(new CurrentUserProjection(accounts, companies)))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .addFilters(new InboundJwtAuthenticationFilter(authenticator, new RestAuthenticationEntryPoint()))
                .build();
    }

    private static Company company(UUID id) {
        return new Company(id, "Legal", null, "CODE", null, CompanyStatus.ACTIVE,
                new CompanySettings("UTC", "USD", 100, 60, 90, 0), Instant.EPOCH, Instant.EPOCH, 1);
    }
}
