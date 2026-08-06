package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.application.port.out.IdentityNotificationWorkPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.TransactionalEmailGateway;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Random;

/** Delivers durable identity work; only sanitized state leaves this use case. */
public final class IdentityNotificationDeliveryWorker {
    private final IdentityNotificationWorkPort store; private final TransactionalEmailGateway gateway; private final Clock clock; private final Random random; private final Duration initial; private final Duration maximum;
    public IdentityNotificationDeliveryWorker(IdentityNotificationWorkPort store, TransactionalEmailGateway gateway, Clock clock, Random random, Duration initial, Duration maximum) { this.store=Objects.requireNonNull(store); this.gateway=Objects.requireNonNull(gateway); this.clock=Objects.requireNonNull(clock); this.random=Objects.requireNonNull(random); this.initial=Objects.requireNonNull(initial); this.maximum=Objects.requireNonNull(maximum); }
    public DispatchResult dispatchAvailable(int limit) { Instant now=clock.instant(); int delivered=0,retried=0,expired=0; for(var work:store.claimDue(now,limit)) { if(!work.expiresAt().isAfter(now)) { store.erase(work.id(),work.tenantId(),now); expired++; continue; } try { gateway.sendPasswordAction(work.delivery().identifier(),work.delivery().token(),work.id().toString()); store.delivered(work.id(),work.tenantId(),now); delivered++; } catch(RuntimeException failure) { Instant next=now.plus(backoff(work.attemptCount()+1)); if(!next.isBefore(work.expiresAt())) { store.erase(work.id(),work.tenantId(),now); expired++; } else { store.retry(work.id(),work.tenantId(),next); retried++; } } } return new DispatchResult(delivered,retried,expired); }
    private Duration backoff(int attempt) { long base=Math.min(initial.toMillis()*(1L<<Math.min(attempt-1,8)),maximum.toMillis()); return Duration.ofMillis(base+random.nextLong(Math.max(1,base/4+1))); }
    public record DispatchResult(int delivered, int retried, int expired) { }
}
