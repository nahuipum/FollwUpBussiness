package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Establishes one trusted correlation identifier before security and application processing.
 */
public final class CorrelationIdFilter extends OncePerRequestFilter {
    public static final String REQUEST_ATTRIBUTE = "com.nahui.followupbussiness.request.correlationId";
    private static final String HEADER = "X-Correlation-Id";
    private static final Pattern CANONICAL_V4 = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        UUID correlationId = acceptedCorrelationId(request);
        if (correlationId == null) {
            reject(response);
            return;
        }
        request.setAttribute(REQUEST_ATTRIBUTE, correlationId);
        response.setHeader(HEADER, correlationId.toString());
        chain.doFilter(request, response);
        response.setHeader(HEADER, correlationId.toString());
    }

    private static UUID acceptedCorrelationId(HttpServletRequest request) {
        List<String> supplied = headers(request);
        if (supplied.isEmpty()) {
            return UUID.randomUUID();
        }
        if (supplied.size() != 1) {
            return null;
        }
        String value = supplied.getFirst();
        if (value == null || value.length() > 100 || !CANONICAL_V4.matcher(value).matches()) {
            return null;
        }
        return UUID.fromString(value);
    }

    private static List<String> headers(HttpServletRequest request) {
        Enumeration<String> values = request.getHeaders(HEADER);
        List<String> supplied = new ArrayList<>();
        while (values.hasMoreElements()) {
            supplied.add(values.nextElement());
        }
        return supplied;
    }

    private static void reject(HttpServletResponse response) throws IOException {
        String correlationId = UUID.randomUUID().toString();
        response.resetBuffer();
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Pragma", "no-cache");
        response.setHeader(HEADER, correlationId);
        response.getWriter().write("{\"type\":\"urn:followupbussiness:correlation-id:invalid\",\"title\":\"Bad Request\",\"status\":400,\"code\":\"CORRELATION_ID_INVALID\",\"detail\":\"The correlation identifier is invalid.\",\"correlationId\":\"" + correlationId + "\"}");
        response.flushBuffer();
    }
}
