package com.nahui.followupbussiness.routing.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.ListSuggestedCustomersUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ListSuggestedCustomersServiceTest {
    private final UUID tenant=UUID.randomUUID(), actorId=UUID.randomUUID(), seller=UUID.randomUUID(), territory=UUID.randomUUID();
    private final CustomerPortfolioReadUseCase customers=mock(CustomerPortfolioReadUseCase.class);
    private final SellerReferenceUseCase sellers=mock(SellerReferenceUseCase.class);
    private final PortfolioAccessScopeUseCase scopes=mock(PortfolioAccessScopeUseCase.class);
    private final ListSuggestedCustomersService service=new ListSuggestedCustomersService(customers,sellers,scopes);

    @Test void ordersDueCandidatesAndIncludesNeverVisitedFromTheirLimaCreationDate() {
        UUID older=UUID.randomUUID(), newer=UUID.randomUUID(), never=UUID.randomUUID();
        permit();
        when(customers.suggestedForSeller(tenant,seller)).thenReturn(List.of(candidate(newer,"2026-01-09T05:00:00Z",2,territory,Instant.parse("2026-01-01T15:00:00Z")),candidate(never,"2026-01-01T05:00:00Z",2,territory,null),candidate(older,"2026-01-09T05:00:00Z",2,territory,Instant.parse("2025-12-30T15:00:00Z"))));
        var page=service.list(new ListSuggestedCustomersUseCase.Query(seller,LocalDate.of(2026,1,10),0,20),admin());
        assertThat(page.items()).extracting(ListSuggestedCustomersUseCase.Item::priority).containsExactly(10,10,8);
        assertThat(page.items()).extracting(ListSuggestedCustomersUseCase.Item::reason).containsExactlyInAnyOrder("FRECUENCIA_VENCIDA","SIN_VISITA_PREVIA","FRECUENCIA_VENCIDA");
    }

    @Test void excludesInactiveTerritoryMissingTerritoryInvalidFrequencyAndFutureDueDateBeforePagination() {
        UUID inactiveTerritory=UUID.randomUUID(), noTerritory=UUID.randomUUID(), invalidFrequency=UUID.randomUUID(), future=UUID.randomUUID(), valid=UUID.randomUUID();
        permit();
        when(customers.suggestedForSeller(tenant,seller)).thenReturn(List.of(candidate(inactiveTerritory,"2026-01-01T05:00:00Z",2,UUID.randomUUID(),null),candidate(noTerritory,"2026-01-01T05:00:00Z",2,null,null),candidate(invalidFrequency,"2026-01-01T05:00:00Z",null,territory,null),candidate(future,"2026-01-09T05:00:00Z",2,territory,Instant.parse("2026-01-09T15:00:00Z")),candidate(valid,"2026-01-01T05:00:00Z",2,territory,null)));
        when(sellers.activeTerritoriesAssignedTo(tenant,seller)).thenReturn(Set.of(territory));
        var page=service.list(new ListSuggestedCustomersUseCase.Query(seller,LocalDate.of(2026,1,10),0,1),admin());
        assertThat(page.total()).isEqualTo(1); assertThat(page.items()).extracting(item -> item.customer().id()).containsExactly(valid);
    }

    @Test void rejectsOutOfTeamSellerBeforeCustomerQuery() {
        when(sellers.allActive(tenant,Set.of(seller))).thenReturn(true);
        when(scopes.resolve(admin())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,false,Set.of()));
        assertThatThrownBy(() -> service.list(new ListSuggestedCustomersUseCase.Query(seller,LocalDate.now(),0,20),admin())).isInstanceOf(ListSuggestedCustomersUseCase.Forbidden.class);
        verifyNoInteractions(customers);
    }

    @Test void rejectsOverflowingPageOffsetBeforeAnyPortIsConsulted() {
        assertThatThrownBy(() -> service.list(new ListSuggestedCustomersUseCase.Query(seller, LocalDate.now(), 107374183, 20), admin()))
                .isInstanceOf(ListSuggestedCustomersUseCase.Invalid.class);
        verifyNoInteractions(customers, sellers, scopes);
    }

    private void permit() { when(sellers.allActive(tenant,Set.of(seller))).thenReturn(true); when(sellers.activeTerritoriesAssignedTo(tenant,seller)).thenReturn(Set.of(territory)); when(scopes.resolve(admin())).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of())); }
    private AuthenticatedActor admin() { return new AuthenticatedActor(actorId,tenant,BaseRole.COMPANY_ADMIN); }
    private CustomerPortfolioReadUseCase.SuggestionCandidate candidate(UUID id,String created,Integer frequency,UUID territoryId,Instant visit) { return new CustomerPortfolioReadUseCase.SuggestionCandidate(new Customer(id,tenant,id.toString(),null,null,null,null,null,"Address",new GeoPoint(-12.1,-77.1),frequency,territoryId,"ACTIVE",Instant.parse(created),Instant.parse(created),1),visit); }
}
