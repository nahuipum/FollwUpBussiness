package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

final class SecurityErrorResponseWriter {

    private SecurityErrorResponseWriter() {
    }

    static void write(HttpServletRequest request, HttpServletResponse response, int status, String body) throws IOException {
        String correlation; try { correlation=java.util.UUID.fromString(request.getHeader("X-Correlation-Id")).toString(); } catch (Exception e) { correlation=java.util.UUID.randomUUID().toString(); }
        response.resetBuffer();
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/problem+json");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("X-Correlation-Id", correlation);
        response.getWriter().write(body);
        response.flushBuffer();
    }
}
