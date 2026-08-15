package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.web.filter.OncePerRequestFilter;

public final class InboundJwtAuthenticationFilter extends OncePerRequestFilter {
    private static final String DLQ_REPROCESS_PREFIX = "/api/v1/internal/outbox/dlq/";
    private final InboundJwtAuthenticator authenticator;
    private final AuthenticationEntryPoint entryPoint;
    private static final String[] PUBLIC_AUTH_ENDPOINTS = {
            "/auth/login",
            "/auth/refresh",
            "/auth/password-recovery-requests",
            "/auth/password-resets"
    };

    public InboundJwtAuthenticationFilter(InboundJwtAuthenticator authenticator, AuthenticationEntryPoint entryPoint) {
        this.authenticator = authenticator;
        this.entryPoint = entryPoint;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = resolveRequestPath(request);
        if (isPublicAuthEndpoint(path)) return true;
        if ("POST".equals(request.getMethod()) && "/auth/logout".equals(path) && "PENDING".equals(request.getHeader("X-Logout-Intent")))
            return true;
        return request.getHeader("Authorization") == null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String path = resolveRequestPath(request);
        if (isPublicAuthEndpoint(path)) {
            chain.doFilter(request, response);
            return;
        }

        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            entryPoint.commence(request, response, new InboundJwtAuthenticator.JwtValidationException());
            return;
        }
        try {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authenticator.authenticate(authorization.substring(7)));
            SecurityContextHolder.setContext(context);
            chain.doFilter(request, response);
        } catch (InboundJwtAuthenticator.JwtValidationException exception) {
            SecurityContextHolder.clearContext();
            entryPoint.commence(request, response, exception);
        }
    }

    private static boolean isPublicAuthEndpoint(String path) {
        for (String endpoint : PUBLIC_AUTH_ENDPOINTS) {
            if (path.equals(endpoint) || path.endsWith(endpoint)) return true;
        }
        return false;
    }

    private static String resolveRequestPath(HttpServletRequest request) {
        String path = request.getServletPath();
        if (path == null || path.isBlank()) {
            path = request.getPathInfo();
        }
        if (path == null || path.isBlank()) {
            path = request.getRequestURI();
        }
        if (path == null) {
            return "";
        }

        int queryIndex = path.indexOf('?');
        if (queryIndex >= 0) {
            path = path.substring(0, queryIndex);
        }
        String contextPath = request.getContextPath();
        if ("/".equals(contextPath)) {
            contextPath = "";
        }
        if (contextPath != null && !contextPath.isBlank() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
            if (path.isBlank()) {
                return "/";
            }
        }
        return normalizePath(path);
    }

    private static String normalizePath(String path) {
        if (path == null) return "";
        if (path.length() > 1 && path.endsWith("/")) return path.substring(0, path.length() - 1);
        return path;
    }
}
