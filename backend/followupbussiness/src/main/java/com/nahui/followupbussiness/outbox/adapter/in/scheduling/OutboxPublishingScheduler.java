package com.nahui.followupbussiness.outbox.adapter.in.scheduling;

import com.nahui.followupbussiness.outbox.application.OutboxPublisher;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import io.micrometer.core.instrument.Counter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.Clock;
import java.time.Duration;

public final class OutboxPublishingScheduler {
    private static final Logger LOGGER = LoggerFactory.getLogger(OutboxPublishingScheduler.class);

    private final OutboxPublisher publisher;
    private final int batchSize;
    private final Duration leaseDuration;
    private final Counter publishedCounter;
    private final Counter retryCounter;
    private final Counter terminalCounter;
    private final Counter dlqCounter;
    private final OutboxStore outboxStore;
    private final Clock clock;
    private final Counter retentionCounter;
    private final Counter failureCounter;

    public OutboxPublishingScheduler(
            OutboxPublisher publisher,
            int batchSize,
            Duration leaseDuration,
            Counter publishedCounter,
            Counter retryCounter,
            Counter terminalCounter,
            Counter dlqCounter,
            OutboxStore outboxStore,
            Clock clock,
            Counter retentionCounter,
            Counter failureCounter) {
        this.publisher = publisher;
        this.batchSize = batchSize;
        this.leaseDuration = leaseDuration;
        this.publishedCounter = publishedCounter;
        this.retryCounter = retryCounter;
        this.terminalCounter = terminalCounter;
        this.dlqCounter = dlqCounter;
        this.outboxStore = outboxStore;
        this.clock = clock;
        this.retentionCounter = retentionCounter;
        this.failureCounter = failureCounter;
    }

    @Scheduled(fixedDelayString = "${followupbussiness.outbox.poll-delay-ms}")
    public void publishAvailable() {
        try {
            OutboxPublisher.DispatchResult result = publisher.dispatchAvailable(batchSize, leaseDuration);
            publishedCounter.increment(result.published());
            retryCounter.increment(result.retried());
            terminalCounter.increment(result.terminal());
            dlqCounter.increment(result.terminal());
            failureCounter.increment(result.failures());
            if (result.claimed() > 0) {
                LOGGER.info("operation=outbox.publish claimed={} published={} retried={} terminal={}",
                        result.claimed(), result.published(), result.retried(), result.terminal());
            }
        } catch (RuntimeException exception) {
            failureCounter.increment();
            LOGGER.error("operation=outbox.publish result=FAILED errorType={}", exception.getClass().getSimpleName());
        }
    }

    @Scheduled(fixedDelayString = "${followupbussiness.outbox.retention-delay-ms:86400000}")
    public void purgeExpiredEvidence() {
        int deleted = outboxStore.deleteCompletedBefore(clock.instant().minus(Duration.ofDays(30)));
        retentionCounter.increment(deleted);
        if (deleted > 0) {
            LOGGER.info("operation=outbox.retention result=DELETED count={}", deleted);
        }
    }
}
