package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;

class InboundJwtAuthenticationFilterTest {
    @RestController
    static class LoginControllerForTest {
        @PostMapping("/auth/login")
        String login() {
            return "ok";
        }

        @PostMapping("/api/auth/login")
        String loginWithPrefix() {
            return "ok";
        }

        @PostMapping("/api/test/protected")
        String protectedEndpoint() {
            return "protected";
        }
    }

    @Test
    void publicLoginRouteSkipsJwtFilterAndUsesControllerEvenWithAuthorizationHeader() throws Exception {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        RestAuthenticationEntryPoint entryPoint = mock(RestAuthenticationEntryPoint.class);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new LoginControllerForTest())
                .addFilters(new InboundJwtAuthenticationFilter(authenticator, entryPoint))
                .build();

        mvc.perform(post("/auth/login").header(HttpHeaders.AUTHORIZATION, "not-bearer-token"))
                .andExpect(status().isOk());

        verifyNoInteractions(authenticator, entryPoint);
    }

    @Test
    void publicLoginRouteWithPrefixSkipsJwtFilter() throws Exception {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        RestAuthenticationEntryPoint entryPoint = mock(RestAuthenticationEntryPoint.class);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new LoginControllerForTest())
                .addFilters(new InboundJwtAuthenticationFilter(authenticator, entryPoint))
                .build();

        mvc.perform(post("/api/auth/login").header(HttpHeaders.AUTHORIZATION, "not-bearer-token"))
                .andExpect(status().isOk());

        verifyNoInteractions(authenticator, entryPoint);
    }

    @Test
    void publicLoginRouteSkipsJwtFilterWhenServletPathIsBlank() throws Exception {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        RestAuthenticationEntryPoint entryPoint = mock(RestAuthenticationEntryPoint.class);

        InboundJwtAuthenticationFilter filter = new InboundJwtAuthenticationFilter(authenticator, entryPoint);
        var request = new org.springframework.mock.web.MockHttpServletRequest("POST", "/auth/login");
        request.setServletPath("");
        request.setPathInfo("/auth/login");
        var response = new org.springframework.mock.web.MockHttpServletResponse();

        filter.doFilter(request, response, (servletRequest, servletResponse) -> {});

        verifyNoInteractions(authenticator, entryPoint);
    }

    @Test
    void malformedAuthorizationOnProtectedRouteStillReturnsUnauthorizedFromSecurityEntryPoint() throws Exception {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        RestAuthenticationEntryPoint entryPoint = new RestAuthenticationEntryPoint();
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new LoginControllerForTest())
                .addFilters(new InboundJwtAuthenticationFilter(authenticator, entryPoint))
                .build();

        var response = mvc.perform(post("/api/test/protected").header(HttpHeaders.AUTHORIZATION, "not-bearer-token"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse();

        assertThat(response.getContentType()).contains("application/problem+json");
        assertThat(response.getContentAsString()).contains("UNAUTHORIZED");
    }
}
