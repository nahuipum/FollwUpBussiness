package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.LoginService;
import com.nahui.followupbussiness.identityaccess.application.port.out.LoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;
import java.nio.charset.StandardCharsets;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(OutputCaptureExtension.class)
class LoginControllerTest {
    @Test
    void rateLimitedLoginReturnsNeutralProblemAndRedisTtlAsRetryAfter() throws Exception {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.execute(any(), anyList(), anyString())).thenReturn(List.of(6L, 321L));
        LoginService service = mock(LoginService.class);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new LoginController(
                service, origin -> "https://web.example.test".equals(origin), new SimpleMeterRegistry(),
                new LoginRateLimiter(redis, hmacKey())))
                .build();

        mvc.perform(post("/auth/login")
                        .header("X-Auth-Client", "WEB")
                        .header("X-Client-Instance-Id", "a0d0cf0e-7b8c-4143-b983-25d9e166aa30")
                        .header("Origin", "https://web.example.test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"person@example.test\",\"password\":\"not-a-real-password\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "321"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.code").value("AUTH_RATE_LIMITED"));
    }

    @Test
    void successfulWebLoginSetsHttpOnlyRefreshCookieAndReturnsCsrfWithoutRefreshBody() throws Exception {
        LoginService service = mock(LoginService.class);
        when(service.login(anyString(), any(char[].class), anyString(), any(UUID.class)))
                .thenReturn(result("WEB"));
        MockMvc mvc = mvc(service);

        mvc.perform(login("WEB").header("Origin", "https://web.example.test"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("__Host-fs-refresh=refresh-secret")))
                .andExpect(jsonPath("$.channel").value("WEB"))
                .andExpect(jsonPath("$.csrfToken").value("csrf-secret"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.credentials.accessToken").value("access-token"));
    }

    @Test
    void successfulMobileLoginReturnsRefreshAndRevocationTicketWithoutCookie() throws Exception {
        LoginService service = mock(LoginService.class);
        when(service.login(anyString(), any(char[].class), anyString(), any(UUID.class)))
                .thenReturn(result("MOBILE"));
        MockMvc mvc = mvc(service);

        mvc.perform(login("MOBILE"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Set-Cookie"))
                .andExpect(jsonPath("$.channel").value("MOBILE"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-secret"))
                .andExpect(jsonPath("$.sessionRevocationTicket").value("revocation-ticket"))
                .andExpect(jsonPath("$.csrfToken").doesNotExist());
    }

    @Test
    void rejectsUnknownAndOverlongLoginPropertiesBeforeAuthentication() throws Exception {
        LoginService service = mock(LoginService.class);
        MockMvc mvc = mvc(service);

        mvc.perform(login("MOBILE").content("{\"identifier\":\"person@example.test\",\"password\":\"not-a-real-password\",\"unexpected\":true}"))
                .andExpect(status().isBadRequest());
        mvc.perform(login("MOBILE").content("x".repeat(LoginRequestSizeFilter.MAX_LOGIN_REQUEST_BYTES + 1)))
                .andExpect(status().isPayloadTooLarge());
    }

    @Test
    void enforcesMaximumIdentifierPasswordAndDeviceLengths() throws Exception {
        MockMvc mvc = mvc(mock(LoginService.class));

        mvc.perform(login("MOBILE").content("{\"identifier\":\"" + "a".repeat(255) + "\",\"password\":\"password\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(login("MOBILE").content("{\"identifier\":\"person@example.test\",\"password\":\"" + "p".repeat(201) + "\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(login("MOBILE").content("{\"identifier\":\"person@example.test\",\"password\":\"password\",\"deviceName\":\"" + "d".repeat(121) + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void validationFailureNeverLogsOrReturnsRejectedCredentialValues(CapturedOutput output) throws Exception {
        String marker = "SENSITIVE_LOGIN_VALUE_" + UUID.randomUUID();
        MockMvc mvc = mvc(mock(LoginService.class));

        String body = "{\"identifier\":\"" + marker.repeat(20) + "\",\"password\":\"password\"}";
        var response = mvc.perform(login("MOBILE").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andReturn().getResponse();

        assertThat(response.getContentAsString()).contains("VALIDATION_FAILED", "Request cannot be processed")
                .doesNotContain(marker, "rejectedValue", "errors");
        assertThat(output.getOut()).doesNotContain(marker);
        assertThat(output.getErr()).doesNotContain(marker);
    }

    private static MockMvc mvc(LoginService service) {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.execute(any(), anyList(), anyString())).thenReturn(List.of(1L, 900L));
        var converter = new JacksonJsonHttpMessageConverter(
                JsonMapper.builder().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build());
        return MockMvcBuilders.standaloneSetup(new LoginController(
                service, origin -> "https://web.example.test".equals(origin), new SimpleMeterRegistry(),
                new LoginRateLimiter(redis, hmacKey())))
                .setMessageConverters(converter)
                .setControllerAdvice(new LoginValidationErrorHandler())
                .addFilters(new LoginRequestSizeFilter())
                .build();
    }

    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder login(String channel) {
        return post("/auth/login")
                .header("X-Auth-Client", channel)
                .header("X-Client-Instance-Id", "a0d0cf0e-7b8c-4143-b983-25d9e166aa30")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"person@example.test\",\"password\":\"not-a-real-password\"}");
    }

    private static LoginService.Result result(String channel) {
        return new LoginService.Result("access-token", "refresh-secret", "WEB".equals(channel) ? "csrf-secret" : null,
                "MOBILE".equals(channel) ? "revocation-ticket" : null,
                new LoginAccountQuery.Account(UUID.randomUUID(), "hash", BaseRole.PLATFORM_SUPERADMIN, null,
                        "ACTIVE", "Platform Administrator", "platform@example.test"), channel);
    }

    private static byte[] hmacKey() {
        return "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);
    }
}
