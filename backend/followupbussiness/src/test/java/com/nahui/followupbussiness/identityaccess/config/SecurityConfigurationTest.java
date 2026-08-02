package com.nahui.followupbussiness.identityaccess.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "field-sales.security.local-secret=TEST_ONLY_NON_SECRET_012345678901234567890123456789",
        "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
        "fieldsales.outbox.enabled=false"
})
@AutoConfigureMockMvc
@Import(SecurityConfigurationTest.TestOnlyController.class)
class SecurityConfigurationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void protectedRouteRejectsUnauthenticatedRequestWithSafe401() throws Exception {
        String responseBody = mockMvc.perform(get("/api/test/protected"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Authentication is required"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertNoInternalInformation(responseBody);
    }

    @ParameterizedTest(name = "{0} {1} remains protected")
    @MethodSource("protectedOperations")
    void noBusinessOrOperationalRouteIsPublicByAccident(HttpMethod method, String path) throws Exception {
        mockMvc.perform(request(method, path))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void forbiddenResponseDoesNotLeakInternalInformation() throws Exception {
        String responseBody = mockMvc.perform(post("/api/test/protected").with(user("test-only-user")))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Access is denied"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertNoInternalInformation(responseBody);
    }

    @Test
    void applicationDoesNotCreateDefaultUsers() {
        assertThat(applicationContext.getBeansOfType(UserDetailsService.class)).isEmpty();
    }

    @Test
    void productionBootJacksonConfigurationRejectsUnknownRequestProperties() throws Exception {
        mockMvc.perform(post("/api/test/strict-json")
                        .with(user("test-only-user"))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"valid\",\"unexpected\":true}"))
                .andExpect(status().isBadRequest());
    }

    private static Stream<Arguments> protectedOperations() {
        return Stream.of(
                Arguments.of(HttpMethod.POST, "/auth/refresh"),
                Arguments.of(HttpMethod.POST, "/auth/logout"),
                Arguments.of(HttpMethod.POST, "/roles"),
                Arguments.of(HttpMethod.PUT, "/roles/SELLER"),
                Arguments.of(HttpMethod.PATCH, "/roles/PLATFORM_SUPERADMIN"),
                Arguments.of(HttpMethod.POST, "/platform/superadmins/bootstrap"),
                Arguments.of(HttpMethod.GET, "/sellers"),
                Arguments.of(HttpMethod.POST, "/sellers"),
                Arguments.of(HttpMethod.GET, "/customers"),
                Arguments.of(HttpMethod.POST, "/customers"),
                Arguments.of(HttpMethod.POST, "/customers/imports"),
                Arguments.of(HttpMethod.GET, "/routes"),
                Arguments.of(HttpMethod.POST, "/routes"),
                Arguments.of(HttpMethod.POST, "/routes/00000000-0000-0000-0000-000000000000/publish"),
                Arguments.of(HttpMethod.POST, "/journeys/start"),
                Arguments.of(HttpMethod.POST, "/journeys/00000000-0000-0000-0000-000000000000/locations"),
                Arguments.of(HttpMethod.POST, "/journeys/00000000-0000-0000-0000-000000000000/close"),
                Arguments.of(HttpMethod.POST, "/visits/check-in"),
                Arguments.of(HttpMethod.POST, "/visits/00000000-0000-0000-0000-000000000000/check-out"),
                Arguments.of(HttpMethod.GET, "/sales"),
                Arguments.of(HttpMethod.POST, "/sales"),
                Arguments.of(HttpMethod.GET, "/reports/daily-dashboard"),
                Arguments.of(HttpMethod.GET, "/actuator/health"),
                Arguments.of(HttpMethod.GET, "/actuator/health/readiness"),
                Arguments.of(HttpMethod.GET, "/unmapped-route"));
    }

    private static void assertNoInternalInformation(String body) {
        assertThat(body)
                .doesNotContainIgnoringCase("exception")
                .doesNotContainIgnoringCase("stack")
                .doesNotContainIgnoringCase("trace")
                .doesNotContainIgnoringCase("secret")
                .doesNotContainIgnoringCase("password")
                .doesNotContainIgnoringCase("authorization")
                .doesNotContain("/api/");
    }

    @RestController
    static class TestOnlyController {

        @GetMapping("/api/test/protected")
        String getProtectedResource() {
            return "protected";
        }

        @PostMapping("/api/test/protected")
        String mutateProtectedResource() {
            return "protected";
        }

        @PostMapping("/api/test/strict-json")
        String strictJson(@RequestBody StrictPayload payload) {
            return payload.name();
        }

        record StrictPayload(String name) { }
    }
}
