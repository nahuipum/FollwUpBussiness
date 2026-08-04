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
    public InboundJwtAuthenticationFilter(InboundJwtAuthenticator authenticator, AuthenticationEntryPoint entryPoint) { this.authenticator = authenticator; this.entryPoint = entryPoint; }
    @Override protected boolean shouldNotFilter(HttpServletRequest request) { return !"POST".equals(request.getMethod()) || !request.getRequestURI().startsWith(DLQ_REPROCESS_PREFIX) || !request.getRequestURI().endsWith("/reprocess"); }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) { entryPoint.commence(request, response, new InboundJwtAuthenticator.JwtValidationException()); return; }
        try { SecurityContext context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(authenticator.authenticate(authorization.substring(7))); SecurityContextHolder.setContext(context); chain.doFilter(request, response); }
        catch (InboundJwtAuthenticator.JwtValidationException exception) { SecurityContextHolder.clearContext(); entryPoint.commence(request, response, exception); }
    }
}
