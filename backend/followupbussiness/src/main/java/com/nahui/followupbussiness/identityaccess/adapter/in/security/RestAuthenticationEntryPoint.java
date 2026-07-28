package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public final class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private static final String RESPONSE_BODY =
            "{\"status\":401,\"code\":\"UNAUTHORIZED\",\"message\":\"Authentication is required\"}";

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authenticationException) throws IOException {

        SecurityErrorResponseWriter.write(response, HttpServletResponse.SC_UNAUTHORIZED, RESPONSE_BODY);
    }
}
