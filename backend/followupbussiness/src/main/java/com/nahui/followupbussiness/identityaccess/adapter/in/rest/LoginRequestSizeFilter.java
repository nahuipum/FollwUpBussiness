package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.web.filter.OncePerRequestFilter;

/** Caps both declared and chunked login bodies before JSON deserialization. */
public final class LoginRequestSizeFilter extends OncePerRequestFilter {
    public static final int MAX_LOGIN_REQUEST_BYTES = 4096;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !"/auth/login".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        String correlationId = correlationId(request.getHeader("X-Correlation-Id"));
        if (request.getContentLengthLong() > MAX_LOGIN_REQUEST_BYTES) {
            reject(response, correlationId);
            return;
        }
        try {
            chain.doFilter(new CappedRequest(request, response, correlationId), response);
        } catch (IOException exception) {
            if (!response.isCommitted()) throw exception;
        }
    }

    private static String correlationId(String supplied) {
        try {
            return supplied == null ? UUID.randomUUID().toString() : UUID.fromString(supplied).toString();
        } catch (IllegalArgumentException ignored) {
            return UUID.randomUUID().toString();
        }
    }

    private static void reject(HttpServletResponse response, String correlationId) throws IOException {
        if (response.isCommitted()) return;
        response.resetBuffer();
        response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/problem+json");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("X-Correlation-Id", correlationId);
        response.getWriter().write("{\"type\":\"urn:fieldsales:auth:request-too-large\",\"status\":413,\"code\":\"AUTH_REQUEST_TOO_LARGE\",\"correlationId\":\"" + correlationId + "\"}");
        response.flushBuffer();
    }

    private static final class CappedRequest extends HttpServletRequestWrapper {
        private final HttpServletResponse response;
        private final String correlationId;

        CappedRequest(HttpServletRequest request, HttpServletResponse response, String correlationId) {
            super(request);
            this.response = response;
            this.correlationId = correlationId;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            return new CappedInputStream(super.getInputStream(), response, correlationId);
        }
    }

    private static final class CappedInputStream extends ServletInputStream {
        private final ServletInputStream delegate;
        private final HttpServletResponse response;
        private final String correlationId;
        private long bytesRead;

        CappedInputStream(ServletInputStream delegate, HttpServletResponse response, String correlationId) {
            this.delegate = delegate;
            this.response = response;
            this.correlationId = correlationId;
        }

        @Override public int read() throws IOException { int value = delegate.read(); check(value < 0 ? 0 : 1); return value; }
        @Override public int read(byte[] bytes, int offset, int length) throws IOException {
            int value = delegate.read(bytes, offset, Math.min(length, remainingWithProbe()));
            check(value < 0 ? 0 : value);
            return value;
        }
        private int remainingWithProbe() { return (int) Math.max(1, Math.min(Integer.MAX_VALUE, MAX_LOGIN_REQUEST_BYTES - bytesRead + 1)); }
        private void check(int read) throws IOException {
            bytesRead += read;
            if (bytesRead > MAX_LOGIN_REQUEST_BYTES) {
                reject(response, correlationId);
                throw new IOException("Login request exceeds configured maximum");
            }
        }
        @Override public boolean isFinished() { return delegate.isFinished(); }
        @Override public boolean isReady() { return delegate.isReady(); }
        @Override public void setReadListener(ReadListener listener) { delegate.setReadListener(listener); }
    }
}
