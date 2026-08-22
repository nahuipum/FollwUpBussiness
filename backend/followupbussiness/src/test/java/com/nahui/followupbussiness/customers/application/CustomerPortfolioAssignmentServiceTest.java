package com.nahui.followupbussiness.customers.application;

import static org.junit.jupiter.api.Assertions.*;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioAssignmentUseCase;
import com.nahui.followupbussiness.customers.application.port.out.CustomerPortfolioStore;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;

class CustomerPortfolioAssignmentServiceTest {
  private final UUID tenant=UUID.randomUUID(), customer=UUID.randomUUID(), seller=UUID.randomUUID();
  private final AuthenticatedActor admin=new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.COMPANY_ADMIN);

  @Test void batchDeniesNonAdminBeforeReadingOrPersistingIdempotency() {
    Store store=new Store();
    var service=service(store, command -> true);
    var command=new CustomerPortfolioAssignmentUseCase.BatchCommand(List.of(customer),Set.of(seller),LocalDate.now(),"motivo",UUID.randomUUID());
    assertThrows(CustomerPortfolioAssignmentUseCase.Forbidden.class,()->service.assignBatch(command,new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.SUPERVISOR)));
    assertEquals(0,store.reservations+store.completions+store.replacements);
  }

  @Test void concurrentBatchesWithSameKeyReplayTheCompletedResultWithoutDuplicateEffects() throws Exception {
    Store store=new Store(); store.blockReplacement=true; int[] audits={0}; var service=service(store, command->{audits[0]++;return true;}); UUID key=UUID.randomUUID();
    var command=new CustomerPortfolioAssignmentUseCase.BatchCommand(List.of(customer),Set.of(seller),LocalDate.of(2026,1,1),"motivo",key);
    try (ExecutorService executor=Executors.newFixedThreadPool(2)) {
      Future<CustomerPortfolioAssignmentUseCase.BatchResult> first=executor.submit(()->service.assignBatch(command,admin));
      assertTrue(store.replacementEntered.await(2,TimeUnit.SECONDS));
      Future<CustomerPortfolioAssignmentUseCase.BatchResult> second=executor.submit(()->service.assignBatch(command,admin));
      assertTrue(store.replayWaiting.await(2,TimeUnit.SECONDS));
      store.releaseReplacement.countDown();
      var firstResult=first.get(2,TimeUnit.SECONDS); var secondResult=second.get(2,TimeUnit.SECONDS);
      assertEquals(firstResult.results(),secondResult.results());
    }
    assertEquals(1,store.replacements); assertEquals(1,audits[0]); assertEquals(1,store.completions);
  }

  @Test void batchUsesPayloadFingerprintAndExactReplayWithoutEffects() {
    Store store=new Store(); int[] audits={0}; var service=service(store, command->{audits[0]++;return true;}); UUID key=UUID.randomUUID();
    var command=new CustomerPortfolioAssignmentUseCase.BatchCommand(List.of(customer),Set.of(seller),LocalDate.of(2026,1,1),"motivo",key);
    var first=service.assignBatch(command,admin); var replay=service.assignBatch(command,admin);
    assertEquals(first.results(),replay.results()); assertEquals(1,store.replacements); assertEquals(1,audits[0]);
    var changed=new CustomerPortfolioAssignmentUseCase.BatchCommand(List.of(customer),Set.of(seller),LocalDate.of(2026,1,2),"motivo",key);
    assertThrows(CustomerPortfolioAssignmentUseCase.Conflict.class,()->service.assignBatch(changed,admin));
    assertEquals(1,store.replacements); assertEquals(1,audits[0]);
  }

  @Test void rejectsSecondFutureAssignmentWithoutReplacingOrAuditing() {
    Store store=new Store(); int[] audits={0}; var service=service(store, command->{audits[0]++;return true;});
    service.assign(new CustomerPortfolioAssignmentUseCase.Command(customer,Set.of(seller),LocalDate.now().plusDays(1),"programada"),admin);
    store.futureAssignment=true;
    int replacements=store.replacements;

    assertThrows(CustomerPortfolioAssignmentUseCase.Conflict.class,()->service.assign(new CustomerPortfolioAssignmentUseCase.Command(customer,Set.of(seller),LocalDate.now().plusDays(2),"otra"),admin));

    assertEquals(replacements,store.replacements); assertEquals(1,audits[0]);
  }

  private CustomerPortfolioAssignmentService service(Store store, RecordAuditEntryUseCase audit) {
    CustomerStore customers=new CustomerStore() {
      @Override public Customer insert(Customer value) { return value; }
      @Override public Optional<Customer> find(UUID tenantId,UUID id) { return tenant.equals(tenantId)&&customer.equals(id)?Optional.of(active()):Optional.empty(); }
      @Override public boolean update(Customer value,long version) { return true; }
      @Override public List<DuplicateMatch> findDuplicateMatches(UUID a,DuplicateCriteria b) { return List.of(); }
    };
    SellerReferenceUseCase sellers=(tenantId, ids)->tenant.equals(tenantId)&&ids.contains(seller);
    return new CustomerPortfolioAssignmentService(customers,store,sellers,audit,Clock.fixed(Instant.EPOCH,ZoneOffset.UTC));
  }
  private Customer active(){ return new Customer(customer,tenant,"Cliente",null,null,null,null,null,"Direccion",new GeoPoint(0,0),null,null,"ACTIVE",Instant.EPOCH,Instant.EPOCH,1); }

  private final class Store implements CustomerPortfolioStore {
    Set<UUID> current=new HashSet<>(); Map<UUID,IdempotencyRecord> records=new HashMap<>(); Set<UUID> pending=new HashSet<>(); int replacements,reservations,completions; boolean blockReplacement,futureAssignment;
    CountDownLatch replacementEntered=new CountDownLatch(1),releaseReplacement=new CountDownLatch(1),replayWaiting=new CountDownLatch(1);
    @Override public List<Assignment> current(UUID tenantId,UUID customerId) { return current.stream().map(id->new Assignment(customerId,id,LocalDate.now(),admin.accountId(),null,Instant.EPOCH)).toList(); }
    @Override public Map<UUID,List<Assignment>> current(UUID tenantId,List<UUID> customerIds) { return customerIds.stream().collect(java.util.stream.Collectors.toMap(id->id,id->current(tenantId,id))); }
    @Override public List<HistoryEntry> history(UUID a,UUID b){return List.of();}
    @Override public void lock(UUID a,UUID b) { }
    @Override public boolean hasFutureAssignment(UUID a,UUID b) { return futureAssignment; }
    @Override public void replace(UUID a,UUID b,Set<UUID> sellers,UUID actor,LocalDate date,String reason,Instant time){ if(blockReplacement) try { replacementEntered.countDown(); releaseReplacement.await(); } catch(InterruptedException e) { Thread.currentThread().interrupt(); throw new IllegalStateException(e); } replacements++;current=new HashSet<>(sellers);}
    @Override public synchronized IdempotencyReservation reserveIdempotency(UUID a,UUID key,String fp,Instant time) { reservations++; while(pending.contains(key)) try { replayWaiting.countDown(); wait(); } catch(InterruptedException e) { Thread.currentThread().interrupt(); throw new IllegalStateException(e); } IdempotencyRecord existing=records.get(key); if(existing!=null) return new IdempotencyReservation(false,existing); pending.add(key); records.put(key,new IdempotencyRecord(fp,List.of())); return new IdempotencyReservation(true,null); }
    @Override public synchronized void completeIdempotency(UUID a,UUID key,List<String> results){completions++; IdempotencyRecord initial=records.get(key); records.put(key,new IdempotencyRecord(initial.fingerprint(),results)); pending.remove(key); notifyAll();}
    @Override public List<Customer> list(com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase.Query a,com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase.Scope b){return List.of();}
    @Override public long count(com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase.Query a,com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase.Scope b){return 0;}
  }
}
