package com.nahui.followupbussiness.customers.adapter.in.rest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioAssignmentUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CustomerPortfolioAssignmentControllerTest {
    private final CustomerPortfolioAssignmentUseCase useCase = mock(CustomerPortfolioAssignmentUseCase.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new CustomerPortfolioAssignmentController(useCase))
            .setControllerAdvice(new CustomerValidationErrorHandler())
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();

    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test
    void mapsIndividualAndBatchResponsesToTheOpenApiPropertyNames() throws Exception {
        UUID tenant = UUID.randomUUID(), customer = UUID.randomUUID(), seller = UUID.randomUUID();
        authenticate(tenant);
        when(useCase.assign(any(), any())).thenReturn(new CustomerPortfolioAssignmentUseCase.Result(customer, Set.of(seller), LocalDate.of(2026, 8, 22), Instant.parse("2026-08-21T10:00:00Z"), 3));
        when(useCase.assignBatch(any(), any())).thenReturn(new CustomerPortfolioAssignmentUseCase.BatchResult(List.of(new CustomerPortfolioAssignmentUseCase.Item(customer, "REJECTED", "CONFLICT"))));

        mvc.perform(put("/customers/{customerId}/assignment", customer).contentType("application/json")
                        .content("{\"sellerIds\":[\"" + seller + "\"],\"effectiveFrom\":\"2026-08-22\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.customerId").value(customer.toString()))
                .andExpect(jsonPath("$.sellerIds[0]").value(seller.toString())).andExpect(jsonPath("$.updatedAt").exists())
                .andExpect(jsonPath("$.version").value(3));
        mvc.perform(post("/customer-assignments/batch").header("Idempotency-Key", UUID.randomUUID())
                        .contentType("application/json").content("{\"customerIds\":[\"" + customer + "\"],\"sellerIds\":[\"" + seller + "\"],\"effectiveFrom\":\"2026-08-22\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.results[0].customerId").value(customer.toString()))
                .andExpect(jsonPath("$.results[0].errorCode").value("CONFLICT"))
                .andExpect(jsonPath("$.replayed").doesNotExist());
    }

    private static void authenticate(UUID tenant) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN), "test", List.of()));
    }
}
