package com.nahui.followupbussiness.workforce.adapter.in.rest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nahui.followupbussiness.identityaccess.adapter.in.security.CorrelationIdFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticationFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.RestAuthenticationEntryPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.application.SellerService;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.Seller;
import com.nahui.followupbussiness.workforce.domain.SellerStatus;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SellerTerritoryAssignmentControllerTest {
    @Test
    void listsSellersWithBatchResolvedSupervisorAndTerritoryReferences() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID supervisorId = UUID.randomUUID();
        UUID territoryId = UUID.randomUUID();
        SellerService service = mock(SellerService.class);
        Seller seller = new Seller(sellerId, tenant, UUID.randomUUID(), "Seller", "seller@example.test", null, null, supervisorId,
                List.of(territoryId), SellerStatus.ACTIVE, Instant.EPOCH, Instant.EPOCH, 1);
        when(service.list(isNull(), isNull(), isNull(), isNull(), eq(0), eq(20), any()))
                .thenReturn(new SellerService.Page(List.of(seller), 1));
        when(service.references(anyList(), any())).thenReturn(Map.of(sellerId,
                new SellerStore.SellerReferences(new SellerStore.Supervisor(supervisorId, "Supervisor visible"),
                        List.of(new SellerStore.Territory(territoryId, "NORTE", "Zona Norte")))));

        mvc(service, Map.of("admin", actor(tenant, BaseRole.COMPANY_ADMIN)))
                .perform(get("/sellers").header("Authorization", "Bearer admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].supervisor.id").value(supervisorId.toString()))
                .andExpect(jsonPath("$.items[0].supervisor.displayName").value("Supervisor visible"))
                .andExpect(jsonPath("$.items[0].territories[0].id").value(territoryId.toString()))
                .andExpect(jsonPath("$.items[0].territories[0].code").value("NORTE"))
                .andExpect(jsonPath("$.items[0].territories[0].name").value("Zona Norte"));
    }

    @Test
    void mapsSuccessfulAndDomainResponsesAndRejectsUnauthorizedActorsWithoutEffects() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID unknownSellerId = UUID.randomUUID();
        UUID territoryId = UUID.randomUUID();
        SellerService service = mock(SellerService.class);
        AuthenticatedActor admin = actor(tenant, BaseRole.COMPANY_ADMIN);
        Map<String, AuthenticatedActor> actors = Map.of("admin", admin, "supervisor", actor(tenant, BaseRole.SUPERVISOR),
                "seller", actor(tenant, BaseRole.SELLER));
        doAnswer((Answer<Seller>) invocation -> {
            AuthenticatedActor actor = invocation.getArgument(2);
            if (actor == null || actor.role() != BaseRole.COMPANY_ADMIN) throw new SellerService.Forbidden();
            UUID requestedSeller = invocation.getArgument(0);
            if (requestedSeller.equals(sellerId)) return seller(sellerId, tenant, territoryId);
            if (requestedSeller.equals(unknownSellerId)) throw new SellerService.NotFound();
            throw new SellerService.Invalid();
        }).when(service).assignTerritories(any(), any(), any(), any());
        MockMvc mvc = mvc(service, actors);

        mvc.perform(put("/sellers/{sellerId}/territories", sellerId).header("Authorization", "Bearer admin")
                        .contentType(MediaType.APPLICATION_JSON).content(body(territoryId)))
                .andExpect(status().isOk()).andExpect(header().exists("X-Correlation-Id"))
                .andExpect(jsonPath("$.id").value(sellerId.toString()));
        SecurityContextHolder.clearContext();
        mvc.perform(put("/sellers/{sellerId}/territories", sellerId).contentType(MediaType.APPLICATION_JSON).content(body(territoryId)))
                .andExpect(status().isForbidden()).andExpect(header().exists("X-Correlation-Id"));
        mvc.perform(put("/sellers/{sellerId}/territories", sellerId).header("Authorization", "Bearer supervisor")
                        .contentType(MediaType.APPLICATION_JSON).content(body(territoryId)))
                .andExpect(status().isForbidden()).andExpect(header().exists("X-Correlation-Id"));
        mvc.perform(put("/sellers/{sellerId}/territories", sellerId).header("Authorization", "Bearer seller")
                        .contentType(MediaType.APPLICATION_JSON).content(body(territoryId)))
                .andExpect(status().isForbidden()).andExpect(header().exists("X-Correlation-Id"));
        mvc.perform(put("/sellers/{sellerId}/territories", unknownSellerId).header("Authorization", "Bearer admin")
                        .contentType(MediaType.APPLICATION_JSON).content(body(territoryId)))
                .andExpect(status().isNotFound()).andExpect(header().exists("X-Correlation-Id"));
        mvc.perform(put("/sellers/{sellerId}/territories", UUID.randomUUID()).header("Authorization", "Bearer admin")
                        .contentType(MediaType.APPLICATION_JSON).content(body(territoryId)))
                .andExpect(status().isUnprocessableEntity()).andExpect(header().exists("X-Correlation-Id"));
    }

    @Test
    void returns400WithCorrelationAndDoesNotInvokeTheUseCaseForMissingOrEmptyTerritories() throws Exception {
        SellerService service = mock(SellerService.class);
        MockMvc mvc = mvc(service, Map.of("admin", actor(UUID.randomUUID(), BaseRole.COMPANY_ADMIN)));

        mvc.perform(put("/sellers/{sellerId}/territories", UUID.randomUUID()).header("Authorization", "Bearer admin")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest()).andExpect(header().exists("X-Correlation-Id"))
                .andExpect(jsonPath("$.correlationId").exists());
        mvc.perform(put("/sellers/{sellerId}/territories", UUID.randomUUID()).header("Authorization", "Bearer admin")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"territoryIds\":[]}"))
                .andExpect(status().isBadRequest()).andExpect(header().exists("X-Correlation-Id"))
                .andExpect(jsonPath("$.correlationId").exists());

        verifyNoInteractions(service);
    }

    @Test
    void returns404ForForeignTenantTerritoryWithoutChangingRelationsAuditOrFilters() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID currentTerritory = UUID.randomUUID();
        UUID foreignTerritory = UUID.randomUUID();
        AssignmentStore store = new AssignmentStore(seller(sellerId, tenant, currentTerritory));
        int[] audits = new int[1];
        SellerService service = new SellerService(store, null, command -> { audits[0]++; return true; }, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
        MockMvc mvc = mvc(service, Map.of("admin", actor(tenant, BaseRole.COMPANY_ADMIN)));

        mvc.perform(put("/sellers/{sellerId}/territories", sellerId).header("Authorization", "Bearer admin")
                        .contentType(MediaType.APPLICATION_JSON).content(body(foreignTerritory)))
                .andExpect(status().isNotFound()).andExpect(header().exists("X-Correlation-Id"));

        assertEquals(List.of(currentTerritory), store.value.territoryIds());
        assertEquals(0, store.relationWrites);
        assertEquals(0, store.filterReads);
        assertEquals(0, audits[0]);
    }

    private static MockMvc mvc(SellerService service, Map<String, AuthenticatedActor> actors) {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        actors.forEach((token, actor) -> org.mockito.Mockito.when(authenticator.authenticate(token))
                .thenReturn(UsernamePasswordAuthenticationToken.authenticated(actor, token, List.of())));
        return MockMvcBuilders.standaloneSetup(new SellerController(service)).setControllerAdvice(new SellerValidationErrorHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .addFilters(new CorrelationIdFilter(), new InboundJwtAuthenticationFilter(authenticator, new RestAuthenticationEntryPoint())).build();
    }

    private static AuthenticatedActor actor(UUID tenant, BaseRole role) {
        return new AuthenticatedActor(UUID.randomUUID(), tenant, role);
    }

    private static Seller seller(UUID id, UUID tenant, UUID territoryId) {
        return new Seller(id, tenant, UUID.randomUUID(), "Seller", "seller@example.test", null, null, null, List.of(territoryId),
                SellerStatus.ACTIVE, Instant.EPOCH, Instant.EPOCH, 1);
    }

    private static String body(UUID territoryId) {
        return "{\"territoryIds\":[\"" + territoryId + "\"]}";
    }

    private static final class AssignmentStore implements SellerStore {
        private Seller value;
        private int relationWrites;
        private int filterReads;

        private AssignmentStore(Seller value) {
            this.value = value;
        }

        @Override public boolean activeSupervisor(UUID tenantId, UUID accountId) { return false; }
        @Override public boolean activeTerritory(UUID tenantId, UUID territoryId) { return false; }
        @Override public boolean territoryBelongsToTenant(UUID tenantId, UUID territoryId) { return false; }
        @Override public Seller insert(Seller seller) { return seller; }
        @Override public Optional<Seller> find(UUID tenantId, UUID sellerId) {
            return value.tenantId().equals(tenantId) && value.id().equals(sellerId) ? Optional.of(value) : Optional.empty();
        }
        @Override public Optional<Seller> replaceTerritories(Seller seller, long expectedVersion) {
            relationWrites++;
            value = seller;
            return Optional.of(seller);
        }
        @Override public List<Seller> list(UUID tenantId, UUID supervisorId, SellerStatus status, UUID requestedSupervisorId, UUID territoryId, String search, int offset, int limit) {
            filterReads++;
            return List.of();
        }
        @Override public long count(UUID tenantId, UUID supervisorId, SellerStatus status, UUID requestedSupervisorId, UUID territoryId, String search) {
            filterReads++;
            return 0;
        }
    }
}
