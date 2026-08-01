package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public final class RestAccessDeniedHandler implements AccessDeniedHandler {

    private static final String RESPONSE_BODY =
            "{\"status\":403,\"code\":\"FORBIDDEN\",\"message\":\"Access is denied\"}";

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {

        SecurityErrorResponseWriter.write(response, HttpServletResponse.SC_FORBIDDEN, RESPONSE_BODY);
    }
}
