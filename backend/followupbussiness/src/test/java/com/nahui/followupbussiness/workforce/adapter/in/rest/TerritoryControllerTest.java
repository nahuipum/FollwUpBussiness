package com.nahui.followupbussiness.workforce.adapter.in.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticationFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.RestAuthenticationEntryPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.application.TerritoryService;
import com.nahui.followupbussiness.workforce.application.port.out.TerritoryStore;
import com.nahui.followupbussiness.workforce.domain.Territory;
import com.nahui.followupbussiness.workforce.domain.TerritoryStatus;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class TerritoryControllerTest {

    @Test
    void httpAuthorizationTenantIsolationAndRejectedEffectsAreObservable() throws Exception {
        UUID tenant = UUID.randomUUID();
        UUID otherTenant = UUID.randomUUID();
        AuthenticatedActor admin = actor(tenant, BaseRole.COMPANY_ADMIN);
        AuthenticatedActor supervisor = actor(tenant, BaseRole.SUPERVISOR);
        AuthenticatedActor seller = actor(tenant, BaseRole.SELLER);
        AuthenticatedActor otherAdmin = actor(otherTenant, BaseRole.COMPANY_ADMIN);
        MemoryStore store = new MemoryStore();
        List<Object> audits = new ArrayList<>();
        TerritoryService service = new TerritoryService(store, command -> {
            audits.add(command);
            return true;
        }, Clock.systemUTC());
        MockMvc mvc = mvc(service, Map.of("admin", admin, "supervisor", supervisor, "seller", seller, "other", otherAdmin));

        var created = mvc.perform(post("/territories").header("Authorization", "Bearer admin")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Norte\",\"code\":\"N\"}"))
                .andExpect(status().isCreated()).andReturn();
        UUID territoryId = UUID.fromString(created.getResponse().getContentAsString().replaceAll(".*\\\"id\\\":\\\"([^\\\"]+).*", "$1"));
        mvc.perform(patch("/territories/{id}", territoryId).header("Authorization", "Bearer admin").header("If-Match", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"description\":\"Actualizado\"}"))
                .andExpect(status().isOk());
        mvc.perform(patch("/territories/{id}", territoryId).header("Authorization", "Bearer admin").header("If-Match", "2")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk());
        assertThat(store.writes).isEqualTo(3);
        assertThat(audits).hasSize(3);

        mvc.perform(get("/territories").header("Authorization", "Bearer supervisor")).andExpect(status().isOk());
        mvc.perform(get("/territories/{id}", territoryId).header("Authorization", "Bearer supervisor")).andExpect(status().isOk());

        int writesBeforeRejections = store.writes;
        int auditsBeforeRejections = audits.size();
        mvc.perform(post("/territories").header("Authorization", "Bearer supervisor")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Sur\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/territories/{id}", territoryId).header("Authorization", "Bearer supervisor").header("If-Match", "3")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/territories").header("Authorization", "Bearer seller")).andExpect(status().isForbidden());
        mvc.perform(get("/territories")).andExpect(status().isForbidden());
        assertThat(store.writes).isEqualTo(writesBeforeRejections);
        assertThat(audits).hasSize(auditsBeforeRejections);

        mvc.perform(get("/territories/{id}", territoryId).header("Authorization", "Bearer other")).andExpect(status().isNotFound());
        mvc.perform(patch("/territories/{id}", territoryId).header("Authorization", "Bearer other").header("If-Match", "3")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(patch("/territories/{id}", territoryId).header("Authorization", "Bearer admin").header("If-Match", "0")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isConflict());
        assertThat(store.writes).isEqualTo(writesBeforeRejections);
        assertThat(audits).hasSize(auditsBeforeRejections);
    }

    private static MockMvc mvc(TerritoryService service, Map<String, AuthenticatedActor> actors) {
        InboundJwtAuthenticator authenticator = mock(InboundJwtAuthenticator.class);
        actors.forEach((token, actor) -> when(authenticator.authenticate(token))
                .thenReturn(UsernamePasswordAuthenticationToken.authenticated(actor, token, List.of())));
        return MockMvcBuilders.standaloneSetup(new TerritoryController(service))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .addFilters(new InboundJwtAuthenticationFilter(authenticator, new RestAuthenticationEntryPoint()))
                .build();
    }

    private static AuthenticatedActor actor(UUID tenant, BaseRole role) {
        return new AuthenticatedActor(UUID.randomUUID(), tenant, role);
    }

    private static final class MemoryStore implements TerritoryStore {
        private final Map<UUID, Territory> territories = new HashMap<>();
        private int writes;

        public Optional<Territory> find(UUID tenantId, UUID id) {
            return Optional.ofNullable(territories.get(id)).filter(territory -> territory.tenantId().equals(tenantId));
        }

        public List<Territory> list(UUID tenantId, TerritoryStatus status, String search, int offset, int size) {
            return territories.values().stream().filter(territory -> territory.tenantId().equals(tenantId))
                    .filter(territory -> status == null || territory.status() == status)
                    .sorted(Comparator.comparing(Territory::name).thenComparing(Territory::id)).toList();
        }

        public long count(UUID tenantId, TerritoryStatus status, String search) {
            return list(tenantId, status, search, 0, 0).size();
        }

        public boolean existsName(UUID tenantId, String name, UUID excludingId) {
            return false;
        }

        public boolean existsCode(UUID tenantId, String code, UUID excludingId) {
            return false;
        }

        public Territory insert(Territory territory) {
            writes++;
            territories.put(territory.id(), territory);
            return territory;
        }

        public Optional<Territory> update(Territory territory, long expectedVersion) {
            Territory previous = territories.get(territory.id());
            if (previous == null || previous.version() != expectedVersion) return Optional.empty();
            writes++;
            territories.put(territory.id(), territory);
            return Optional.of(territory);
        }
    }
}
