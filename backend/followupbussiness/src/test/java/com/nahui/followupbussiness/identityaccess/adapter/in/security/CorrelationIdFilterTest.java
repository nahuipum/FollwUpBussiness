package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class CorrelationIdFilterTest {
    private static final String HEADER = "X-Correlation-Id";

    @Test
    void absentIdGeneratesCanonicalV4IdAndContinues() throws Exception {
        MockHttpServletRequest request = request();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        new CorrelationIdFilter().doFilter(request, response, (r, s) -> continued.set(true));

        assertThat(continued.get()).isTrue();
        assertCanonicalV4(response.getHeader(HEADER));
        assertThat(request.getAttribute(CorrelationIdFilter.REQUEST_ATTRIBUTE).toString())
                .isEqualTo(response.getHeader(HEADER));
    }

    @Test
    void validCanonicalV4IdIsPreservedAndContinues() throws Exception {
        String correlationId = "a0d0cf0e-7b8c-4143-b983-25d9e166aa30";
        MockHttpServletRequest request = request();
        request.addHeader(HEADER, correlationId);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        new CorrelationIdFilter().doFilter(request, response, (r, s) -> continued.set(true));

        assertThat(continued.get()).isTrue();
        assertThat(response.getHeader(HEADER)).isEqualTo(correlationId);
        assertThat(request.getAttribute(CorrelationIdFilter.REQUEST_ATTRIBUTE)).isEqualTo(UUID.fromString(correlationId));
    }

    @Test
    void invalidEmptyDuplicateAndExcessiveIdsAreRejectedBeforeTheChain() throws Exception {
        assertRejected("not-a-uuid");
        assertRejected("");
        assertRejected("a".repeat(101));

        MockHttpServletRequest duplicate = request();
        duplicate.addHeader(HEADER, "a0d0cf0e-7b8c-4143-b983-25d9e166aa30");
        duplicate.addHeader(HEADER, "b0d0cf0e-7b8c-4143-b983-25d9e166aa30");
        assertRejected(duplicate);
    }

    private static void assertRejected(String supplied) throws Exception {
        MockHttpServletRequest request = request();
        request.addHeader(HEADER, supplied);
        assertRejected(request);
    }

    private static void assertRejected(MockHttpServletRequest request) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        var chain = mock(jakarta.servlet.FilterChain.class);

        new CorrelationIdFilter().doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(400);
        assertThat(response.getContentType()).startsWith("application/problem+json");
        assertThat(response.getContentAsString()).contains("CORRELATION_ID_INVALID");
        assertThat(response.getContentAsString()).contains("\"detail\":\"The correlation identifier is invalid.\"");
        assertCanonicalV4(response.getHeader(HEADER));
        assertThat(response.getContentAsString()).contains(response.getHeader(HEADER));
        verifyNoInteractions(chain);
    }

    private static MockHttpServletRequest request() {
        return new MockHttpServletRequest("POST", "/api/test/protected");
    }

    private static void assertCanonicalV4(String value) {
        assertThat(value).matches("^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$");
    }
}
