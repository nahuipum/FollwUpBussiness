package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import jakarta.servlet.http.HttpServletRequestWrapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRequestSizeFilterTest {
    @Test
    void capsAnUnknownLengthStreamAndReturnsSafeProblemDetails() throws Exception {
        var request = new MockHttpServletRequest("POST", "/auth/login");
        request.setContentType("application/json");
        request.addHeader("X-Correlation-Id", "a0d0cf0e-7b8c-4143-b983-25d9e166aa30");
        request.setContent("x".repeat(LoginRequestSizeFilter.MAX_LOGIN_REQUEST_BYTES + 1).getBytes(StandardCharsets.UTF_8));
        var unknownLength = new HttpServletRequestWrapper(request) {
            @Override public long getContentLengthLong() { return -1; }
            @Override public int getContentLength() { return -1; }
        };
        var response = new MockHttpServletResponse();

        new LoginRequestSizeFilter().doFilter(unknownLength, response, (servletRequest, servletResponse) ->
                servletRequest.getInputStream().readAllBytes());

        assertThat(response.getStatus()).isEqualTo(413);
        assertThat(response.getContentType()).startsWith("application/problem+json");
        assertThat(response.getHeader("Cache-Control")).isEqualTo("no-store");
        assertThat(response.getHeader("X-Correlation-Id")).isEqualTo("a0d0cf0e-7b8c-4143-b983-25d9e166aa30");
        assertThat(response.getContentAsString()).contains("\"code\":\"AUTH_REQUEST_TOO_LARGE\"");
    }
}
