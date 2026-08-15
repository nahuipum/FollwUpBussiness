package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.RefreshService;
import com.nahui.followupbussiness.identityaccess.application.port.in.RefreshSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.out.LoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;

import java.nio.charset.StandardCharsets;
import java.util.*;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RefreshControllerTest {
    @Test
    void webUsesCookieCsrfAndNeverReturnsRefreshInJson() throws Exception {
        var use = mock(RefreshSessionUseCase.class);
        when(use.refresh(any())).thenReturn(result("WEB"));
        var mvc = MockMvcBuilders.standaloneSetup(new RefreshController(use, o -> "https://web.test".equals(o), limiter(), projection())).build();
        mvc.perform(post("/auth/refresh").header("X-Auth-Client", "WEB").header("X-Client-Instance-Id", UUID.randomUUID()).header("Origin", "https://web.test").header("X-CSRF-Token", "csrf").cookie(new jakarta.servlet.http.Cookie("__Host-fs-refresh", "x".repeat(43)))).andExpect(status().isOk()).andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("HttpOnly"))).andExpect(jsonPath("$.refreshToken").doesNotExist()).andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void mobileBrowserAndWebBodyAreRejectedBeforeCredentials() throws Exception {
        var use = mock(RefreshSessionUseCase.class);
        var mvc = MockMvcBuilders.standaloneSetup(new RefreshController(use, o -> true, limiter(), projection())).build();
        mvc.perform(post("/auth/refresh").header("X-Auth-Client", "MOBILE").header("X-Client-Instance-Id", UUID.randomUUID()).header("Origin", "https://evil.test").contentType(MediaType.APPLICATION_JSON).content("{\"refreshToken\":\"" + "x".repeat(43) + "\"}")).andExpect(status().isBadRequest()).andExpect(header().doesNotExist("Set-Cookie"));
        verifyNoInteractions(use);
    }

    @Test
    void tenantWithoutUsableCompanyIsRejectedBeforeCredentialsAreEmitted() throws Exception {
        var use = mock(RefreshSessionUseCase.class);
        var company = UUID.randomUUID();
        when(use.refresh(any())).thenReturn(new RefreshService.Result("jwt", "x".repeat(43), new LoginAccountQuery.Account(UUID.randomUUID(), "h", BaseRole.SELLER, company, "ACTIVE", "User", "u@example.test"), "csrf", "MOBILE"));
        var mvc = MockMvcBuilders.standaloneSetup(new RefreshController(use, o -> true, limiter(), new CurrentUserProjection(null, id -> java.util.Optional.empty()))).build();
        mvc.perform(post("/auth/refresh").header("X-Auth-Client", "MOBILE").header("X-Client-Instance-Id", UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON).content("{\"refreshToken\":\"" + "x".repeat(43) + "\"}")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("REFRESH_TOKEN_INVALID")).andExpect(header().doesNotExist("Set-Cookie"));
    }

    private static RefreshRateLimiter limiter() {
        var redis = mock(StringRedisTemplate.class);
        when(redis.execute(any(), anyList(), anyString())).thenReturn(List.of(1L, 60L));
        return new RefreshRateLimiter(redis, "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));
    }

    private static RefreshService.Result result(String c) {
        return new RefreshService.Result("jwt", "x".repeat(43), new LoginAccountQuery.Account(UUID.randomUUID(), "h", BaseRole.SELLER, UUID.randomUUID(), "ACTIVE", "User", "u@example.test"), "csrf", c);
    }

    private static CurrentUserProjection projection() {
        return new CurrentUserProjection(null, id -> java.util.Optional.of(new com.nahui.followupbussiness.tenancy.domain.model.Company(id, "Legal", null, "CODE", null, com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus.ACTIVE, new com.nahui.followupbussiness.tenancy.domain.model.CompanySettings("UTC", "USD", 100, 60, 90, 0), java.time.Instant.EPOCH, java.time.Instant.EPOCH, 1)));
    }
}
