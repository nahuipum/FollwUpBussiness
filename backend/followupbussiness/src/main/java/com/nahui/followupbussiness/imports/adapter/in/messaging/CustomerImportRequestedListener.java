package com.nahui.followupbussiness.imports.adapter.in.messaging;

import com.nahui.followupbussiness.imports.application.CustomerImportProcessor;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportProcessingAudit;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import io.micrometer.core.instrument.Counter;

import java.util.UUID;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Consumes the minimal outbox envelope; it never logs or deserializes import contents.
 */
public final class CustomerImportRequestedListener {
    private static final int MAX_DELIVERIES = 4;
    private final CustomerImportProcessor processor;
    private final CustomerImportStore store;
    private final CustomerImportProcessingAudit audit;
    private final ObjectMapper json;
    private final RabbitTemplate rabbit;
    private final Counter processed;
    private final Counter failed;

    public CustomerImportRequestedListener(CustomerImportProcessor processor, CustomerImportStore store, CustomerImportProcessingAudit audit, ObjectMapper json, RabbitTemplate rabbit, Counter processed, Counter failed) {
        this.processor = processor;
        this.store = store;
        this.audit = audit;
        this.json = json;
        this.rabbit = rabbit;
        this.processed = processed;
        this.failed = failed;
    }

    @RabbitListener(queues = "${followupbussiness.imports.work-queue:customer-import.requested.v1}")
    public void receive(Message message) {
        if (deliveries(message) >= MAX_DELIVERIES) {
            failAndQuarantine(message, idsOrNull(message));
            return;
        }
        MessageIds ids = idsOrNull(message);
        if (ids == null) {
            quarantine(message);
            return;
        }
        try {
            processor.process(ids.importId, ids.tenantId);
            store.findById(ids.tenantId, ids.importId).filter(job -> job.status() == CustomerImport.Status.COMPLETED || job.status() == CustomerImport.Status.COMPLETED_WITH_ERRORS || job.status() == CustomerImport.Status.FAILED).ifPresent(this::audit);
            processed.increment();
        } catch (RuntimeException exception) {
            scheduleRetry(message);
        }
    }

    private void audit(CustomerImport job) {
        audit.record(job.tenantId(), job.requestedBy(), job.id(), job.correlationId(), job.status().name());
    }

    private void failAndQuarantine(Message message, MessageIds ids) {
        try {
            if (ids != null) processor.failAfterDeliveryExhausted(ids.importId, ids.tenantId).ifPresent(this::audit);
        } catch (
                RuntimeException ignored) { /* DLQ is the terminal outcome even when persistence/audit is unavailable. */ }
        quarantine(message);
    }

    private void scheduleRetry(Message message) {
        message.getMessageProperties().setHeader("x-customer-import-delivery", deliveries(message));
        rabbit.send("followupbussiness.events", "customer-import.retry.v1", message);
    }

    private void quarantine(Message message) {
        rabbit.send("followupbussiness.events", "customer-import.dlq.v1", message);
        failed.increment();
    }

    private MessageIds idsOrNull(Message message) {
        try {
            JsonNode root = json.readTree(message.getBody());
            JsonNode payload = root.path("payload");
            return new MessageIds(UUID.fromString(payload.path("importId").asText()), UUID.fromString(payload.path("tenantId").asText()));
        } catch (Exception ignored) {
            return null;
        }
    }

    private static long deliveries(Message message) {
        long tracked = deliveryCount(message.getMessageProperties().getHeaders().get("x-customer-import-delivery"));
        if (tracked > 0) return tracked + 1;
        Object deaths = message.getMessageProperties().getHeaders().get("x-death");
        if (deaths instanceof java.util.List<?> list)
            return list.stream().filter(java.util.Map.class::isInstance).map(java.util.Map.class::cast).mapToLong(m -> deliveryCount(m.get("count"))).sum() + 1;
        return 1;
    }

    private static long deliveryCount(Object count) {
        if (count instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(count));
        } catch (NumberFormatException ignored) {
            return 0L;
        }
    }

    private record MessageIds(UUID importId, UUID tenantId) {
    }
}
