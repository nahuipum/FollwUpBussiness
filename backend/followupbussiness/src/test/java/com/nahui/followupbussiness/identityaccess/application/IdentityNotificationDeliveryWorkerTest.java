package com.nahui.followupbussiness.identityaccess.application;

import static org.assertj.core.api.Assertions.assertThat;
import com.nahui.followupbussiness.identityaccess.application.port.out.IdentityNotificationWorkPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.TransactionalEmailGateway;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class IdentityNotificationDeliveryWorkerTest {
    private final Instant now=Instant.parse("2026-08-06T00:00:00Z"); private final UUID id=UUID.randomUUID(), tenant=UUID.randomUUID();
    @Test void failureRetriesWithJitterBeforeExpirationAndSuccessCryptoErases(){ var store=new Store(now.plusSeconds(60)); var gateway=new Gateway(true); var worker=worker(store,gateway); assertThat(worker.dispatchAvailable(1)).extracting("retried").isEqualTo(1); assertThat(store.next).isAfter(now.plusSeconds(1)); gateway.fail=false; assertThat(worker.dispatchAvailable(1)).extracting("delivered").isEqualTo(1); assertThat(store.erased).isTrue(); }
    @Test void expiredOrUnretryableWorkIsErasedWithoutSending(){ var store=new Store(now); var gateway=new Gateway(false); assertThat(worker(store,gateway).dispatchAvailable(1)).extracting("expired").isEqualTo(1); assertThat(gateway.calls).isZero(); assertThat(store.erased).isTrue(); }
    @Test void reusesTheDurableWorkIdAsIdempotencyKeyAfterLeaseRecovery(){ var store=new Store(now.plusSeconds(60)); var gateway=new Gateway(false); var worker=worker(store,gateway); worker.dispatchAvailable(1); String first=gateway.idempotencyKey; worker.dispatchAvailable(1); assertThat(gateway.idempotencyKey).isEqualTo(first).isEqualTo(id.toString()); }
    private IdentityNotificationDeliveryWorker worker(Store store,Gateway gateway){return new IdentityNotificationDeliveryWorker(store,gateway,Clock.fixed(now,ZoneOffset.UTC),new Random(0),Duration.ofSeconds(1),Duration.ofMinutes(5));}
    private final class Store implements IdentityNotificationWorkPort { Instant expires,next; boolean erased; Store(Instant expires){this.expires=expires;} public List<Work> claimDue(Instant n,int l){return erased?List.of():List.of(new Work(id,tenant,new Delivery("x@example.test","T".repeat(43)),expires,0));} public void delivered(UUID i,UUID t,Instant n){erased=true;} public void retry(UUID i,UUID t,Instant n){next=n;} public void erase(UUID i,UUID t,Instant n){erased=true;} }
    private static final class Gateway implements TransactionalEmailGateway { boolean fail; int calls; String idempotencyKey; Gateway(boolean fail){this.fail=fail;} public void sendPasswordAction(String i,String t,String key){calls++;idempotencyKey=key;if(fail)throw new IllegalStateException();} }
}
