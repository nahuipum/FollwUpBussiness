package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CompanyUserControllerTest {
    private CompanyUserService service; private MockMvc mvc; private AuthenticatedActor actor;
    @BeforeEach void setUp() { service = mock(CompanyUserService.class); actor = new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN);
        mvc = MockMvcBuilders.standaloneSetup(new CompanyUserController(service)).setControllerAdvice(new LoginValidationErrorHandler()).setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build(); }
    @Test void idRoutesBindTheOpenApiUserIdVariableAndReachTheUseCase() throws Exception {
        UUID id = UUID.randomUUID(); var user = user(id); when(service.get(eq(id), isNull(), any())).thenReturn(user); when(service.update(eq(id), any(), isNull(), any())).thenReturn(user); when(service.status(eq(id),eq("LOCKED"),isNull(),any())).thenReturn(user);
        mvc.perform(get("/company/users/{userId}",id).principal(() -> "x")).andExpect(status().isOk());
        mvc.perform(patch("/company/users/{userId}",id).principal(() -> "x").header("If-Match","1").contentType(MediaType.APPLICATION_JSON).content("{\"displayName\":\"Name\",\"email\":\"a@example.test\",\"role\":\"SUPERVISOR\"}")).andExpect(status().isOk());
        mvc.perform(patch("/company/users/{userId}/status",id).principal(() -> "x").contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"LOCKED\"}")).andExpect(status().isOk());
        verify(service).get(eq(id), isNull(), any()); verify(service).update(eq(id), any(), isNull(), any()); verify(service).status(eq(id),eq("LOCKED"),isNull(),any());
    }
    @Test void malformedUserIdIsRejectedBeforeTheUseCase() throws Exception { mvc.perform(get("/company/users/not-a-uuid").principal(() -> "x")).andExpect(status().isBadRequest()); verifyNoInteractions(service); }
    @Test
    void patchWithMalformedJsonContainingLiteralCrLfReturnsSafeProblemDetailBeforeTheUseCase() throws Exception {
        UUID id = UUID.randomUUID();
        String email = "sensitive@example.test";
        String malformedJson = "{\"email\":\"" + email + "\r\"}";
        mvc.perform(patch("/company/users/{userId}",id).principal(() -> "x").header("If-Match","1").contentType(MediaType.APPLICATION_JSON)
                .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:followupbussiness:auth:validation-failed"))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Request cannot be processed"))
                .andExpect(jsonPath("$.correlationId").exists())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString(email))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Illegal unquoted character"))));
        verifyNoInteractions(service);
    }
    @Test
    void patchWithEscapedCrLfReachesValidationAndReturnsSafeProblemDetailBeforeTheUseCase() throws Exception {
        UUID id = UUID.randomUUID();
        String email = "sensitive@example.test";
        String validJsonWithEscapedCrLf = "{\"email\":\"" + email + "\\r\\n\"}";
        mvc.perform(patch("/company/users/{userId}",id).principal(() -> "x").header("If-Match","1").contentType(MediaType.APPLICATION_JSON)
                .content(validJsonWithEscapedCrLf))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:followupbussiness:company-users:error"))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Request cannot be processed"))
                .andExpect(jsonPath("$.correlationId").exists())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString(email))));
        verifyNoInteractions(service);
    }
    @Test void listReturnsContractPageAndBindsOnlyDeclaredFilters() throws Exception { when(service.list(1,2,"name",BaseRole.SUPERVISOR,"ACTIVE",null)).thenReturn(new CompanyUserService.UserPage(List.of(user(UUID.randomUUID())),new CompanyUserService.PageInfo(1,2,3,2)));
        mvc.perform(get("/company/users?page=1&pageSize=2&search=name&role=SUPERVISOR&status=ACTIVE").principal(() -> "x")).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].id").exists()).andExpect(jsonPath("$.page.page").value(1)).andExpect(jsonPath("$.page.totalElements").value(3)); }
    private static CompanyUserService.User user(UUID id) { return new CompanyUserService.User(id,"Name","name","a@example.test",BaseRole.SUPERVISOR,"ACTIVE",Instant.EPOCH,Instant.EPOCH,1); }
}
