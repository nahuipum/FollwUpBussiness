package com.nahui.followupbussiness.customers.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.*;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.*;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import java.time.Clock;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;

public class UpdateCustomerService {
  private final CustomerStore store; private final RecordAuditEntryUseCase audit; private final Clock clock;
  public UpdateCustomerService(CustomerStore store, RecordAuditEntryUseCase audit, Clock clock) { this.store=store; this.audit=audit; this.clock=clock; }
  @Transactional public Customer update(UUID id, long version, Patch p, AuthenticatedActor actor) {
    UUID tenant=tenant(actor); Customer old=store.find(tenant,id).orElseThrow(NotFound::new);
    if (old.version()!=version) throw new Conflict();
    if (p.territoryIdSet && p.territoryId!=null && !store.activeTerritory(tenant,p.territoryId)) throw new InvalidTerritory();
    Customer next=new Customer(old.id(),tenant,p.nameSet?p.name:old.name(),p.documentTypeSet?p.documentType:old.documentType(),p.documentNumberSet?p.documentNumber:old.documentNumber(),p.phoneSet?p.phone:old.phone(),p.emailSet?p.email:old.email(),p.addressSet?p.address:old.address(),p.locationSet?p.location:old.location(),p.visitFrequencyDaysSet?p.visitFrequencyDays:old.visitFrequencyDays(),p.territoryIdSet?p.territoryId:old.territoryId(),p.statusSet?p.status:old.status(),old.createdAt(),clock.instant(),old.version()+1);
    if (!store.update(next,version)) throw new Conflict();
    if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION,AuditResourceType.CUSTOMER,id,AuditResult.SUCCESS,Map.of("status",old.status()),Map.of("status",next.status())))) throw new IllegalStateException("audit persistence failed");
    return next;
  }
  private static UUID tenant(AuthenticatedActor a) { if(a==null||a.tenantId()==null||a.role()!=BaseRole.COMPANY_ADMIN) throw new Forbidden(); return a.tenantId(); }
  public record Patch(String name,boolean nameSet,String documentType,boolean documentTypeSet,String documentNumber,boolean documentNumberSet,String phone,boolean phoneSet,String email,boolean emailSet,String address,boolean addressSet,GeoPoint location,boolean locationSet,Integer visitFrequencyDays,boolean visitFrequencyDaysSet,UUID territoryId,boolean territoryIdSet,String status,boolean statusSet) {}
  public static final class Forbidden extends RuntimeException{} public static final class NotFound extends RuntimeException{} public static final class Conflict extends RuntimeException{} public static final class InvalidTerritory extends RuntimeException{}
}
