package com.nahui.followupbussiness.workforce.application;

import static org.junit.jupiter.api.Assertions.*;
import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import com.nahui.followupbussiness.workforce.application.port.out.SellerStore;
import com.nahui.followupbussiness.workforce.domain.Seller;
import java.time.*; import java.util.*; import org.junit.jupiter.api.Test;

class SellerServiceTest {
    private final UUID tenant=UUID.randomUUID(), supervisor=UUID.randomUUID(), territory=UUID.randomUUID();
    @Test void onlyAdminCanCreateAndInactiveRelationCreatesNothing() {
        Store store=new Store(); SellerService service=service(store);
        var seller=new SellerService.Command("Seller One",null,"seller@example.test",null,null,supervisor,List.of(territory));
        assertThrows(SellerService.Forbidden.class,()->service.create(seller,new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.SUPERVISOR,null),UUID.randomUUID()));
        store.active=false;
        assertThrows(SellerService.Invalid.class,()->service.create(seller,admin(),UUID.randomUUID()));
        assertNull(store.saved);
    }
    @Test void validAdminPersistsSeparateSellerAfterInvitedUser() {
        Store store=new Store(); SellerService result=service(store);
        Seller seller=result.create(new SellerService.Command("Seller One","seller","seller@example.test",null,null,supervisor,List.of(territory)),admin(),UUID.randomUUID());
        assertNotNull(seller.userId()); assertSame(seller,store.saved); assertEquals(List.of(territory),seller.territoryIds());
    }
    @Test void auditFailureIsPropagated() {
        Store store=new Store(); CompanyUserService users=new CompanyUserService(null,Clock.systemUTC()) { @Override public User inviteSeller(Invite i,AuthenticatedActor a,UUID c){return new User(UUID.randomUUID(),i.name(),i.username(),i.email(),BaseRole.SELLER,"INVITED",Instant.now(),Instant.now(),1);}};
        SellerService service=new SellerService(store,users,x->false,Clock.systemUTC());
        assertThrows(IllegalStateException.class,()->service.create(new SellerService.Command("Seller One",null,"seller@example.test",null,null,supervisor,List.of(territory)),admin(),UUID.randomUUID()));
    }
    private SellerService service(Store store){
        CompanyUserService users=new CompanyUserService(null,Clock.systemUTC()) { @Override public User inviteSeller(Invite i,AuthenticatedActor a,UUID c){ return new User(UUID.randomUUID(),i.name(),i.username(),i.email(),BaseRole.SELLER,"INVITED",Instant.now(),Instant.now(),1); }};
        RecordAuditEntryUseCase audit=(RecordAuditEntryCommand x)->true; return new SellerService(store,users,audit,Clock.systemUTC());
    }
    private AuthenticatedActor admin(){return new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.COMPANY_ADMIN,null);}
    private final class Store implements SellerStore { boolean active=true; Seller saved; public boolean activeSupervisor(UUID t,UUID id){return active&&tenant.equals(t)&&supervisor.equals(id);} public boolean activeTerritory(UUID t,UUID id){return active&&tenant.equals(t)&&territory.equals(id);} public Seller insert(Seller s){return saved=s;} }
}
