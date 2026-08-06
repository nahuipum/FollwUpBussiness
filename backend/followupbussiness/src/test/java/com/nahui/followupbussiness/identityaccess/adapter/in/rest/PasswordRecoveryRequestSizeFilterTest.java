package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import jakarta.servlet.http.HttpServletRequestWrapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordRecoveryRequestSizeFilterTest {
    @Test
    void rejectsChunkedOversizedBodiesBeforeEitherRecoveryEndpointIsDeserialized() throws Exception {
        for (String path : new String[]{"/auth/password-recovery-requests", "/auth/password-resets"}) {
            var request = new MockHttpServletRequest("POST", path);
            request.setContent("x".repeat(LoginRequestSizeFilter.MAX_LOGIN_REQUEST_BYTES + 1).getBytes(StandardCharsets.UTF_8));
            var unknownLength = new HttpServletRequestWrapper(request) {
                @Override public long getContentLengthLong() { return -1; }
                @Override public int getContentLength() { return -1; }
            };
            var response = new MockHttpServletResponse();
            new PasswordRecoveryRequestSizeFilter().doFilter(unknownLength, response,
                    (servletRequest, servletResponse) -> servletRequest.getInputStream().readAllBytes());
            assertThat(response.getStatus()).isEqualTo(413);
        }
    }
}
