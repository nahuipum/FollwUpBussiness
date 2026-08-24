package com.nahui.followupbussiness.imports.adapter.in.messaging;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.imports.application.CustomerImportProcessor;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportProcessingAudit;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import tools.jackson.databind.json.JsonMapper;

class CustomerImportRequestedListenerTest {
    @Test void invalidEnvelopeIsQuarantinedWithoutProcessingOrRequeue() {
        CustomerImportProcessor processor = mock(CustomerImportProcessor.class); CustomerImportStore store = mock(CustomerImportStore.class);
        CustomerImportProcessingAudit audit = mock(CustomerImportProcessingAudit.class); RabbitTemplate rabbit = mock(RabbitTemplate.class);
        var meters = new SimpleMeterRegistry(); var listener = new CustomerImportRequestedListener(processor, store, audit, JsonMapper.builder().build(), rabbit, meters.counter("processed"), meters.counter("failed"));
        listener.receive(new Message("not-json".getBytes(), new MessageProperties()));
        verify(processor, never()).process(any(), any()); verify(processor, never()).failAfterDeliveryExhausted(any(), any());
        verify(rabbit).send(eq("followupbussiness.events"), eq("customer-import.dlq.v1"), any(Message.class));
        org.assertj.core.api.Assertions.assertThat(meters.counter("failed").count()).isEqualTo(1d);
    }

    @Test void exhaustedDeliveryFailsJobAuditsWithoutPiiAndForwardsToDlq() {
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID(), actorId = UUID.randomUUID(), correlationId = UUID.randomUUID();
        CustomerImportProcessor processor = mock(CustomerImportProcessor.class); CustomerImportStore store = mock(CustomerImportStore.class);
        CustomerImportProcessingAudit audit = mock(CustomerImportProcessingAudit.class); RabbitTemplate rabbit = mock(RabbitTemplate.class);
        CustomerImport failed = new CustomerImport(importId, tenantId, actorId, correlationId, "key", "file.csv", "text/csv", "1.0", true, "0".repeat(64), CustomerImport.Status.FAILED, 0, 0, Instant.now(), Instant.now(), Instant.now(), Instant.now());
        when(processor.failAfterDeliveryExhausted(importId, tenantId)).thenReturn(Optional.of(failed));
        var meters = new SimpleMeterRegistry(); var listener = new CustomerImportRequestedListener(processor, store, audit, JsonMapper.builder().build(), rabbit, meters.counter("processed"), meters.counter("failed"));
        MessageProperties properties = new MessageProperties(); properties.setHeader("x-death", List.of(Map.of("count", 3L)));
        listener.receive(new Message(("{\"payload\":{\"importId\":\"" + importId + "\",\"tenantId\":\"" + tenantId + "\"}}").getBytes(), properties));
        verify(processor, never()).process(any(), any()); verify(audit).record(tenantId, actorId, importId, correlationId, "FAILED");
        verify(rabbit).send(eq("followupbussiness.events"), eq("customer-import.dlq.v1"), any(Message.class));
        org.assertj.core.api.Assertions.assertThat(meters.counter("failed").count()).isEqualTo(1d);
    }

    @Test void processingFailureSchedulesDelayedRetryWithoutHotRequeueOrDlq() {
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID();
        CustomerImportProcessor processor = mock(CustomerImportProcessor.class); CustomerImportStore store = mock(CustomerImportStore.class);
        CustomerImportProcessingAudit audit = mock(CustomerImportProcessingAudit.class); RabbitTemplate rabbit = mock(RabbitTemplate.class);
        doThrow(new IllegalStateException("database unavailable")).when(processor).process(importId, tenantId);
        var meters = new SimpleMeterRegistry(); var listener = new CustomerImportRequestedListener(processor, store, audit, JsonMapper.builder().build(), rabbit, meters.counter("processed"), meters.counter("failed"));
        listener.receive(envelope(importId, tenantId, null));
        verify(rabbit).send(eq("followupbussiness.events"), eq("customer-import.retry.v1"), any(Message.class));
        verify(rabbit, never()).send(eq("followupbussiness.events"), eq("customer-import.dlq.v1"), any(Message.class));
        verify(processor, never()).failAfterDeliveryExhausted(any(), any());
    }

    @Test void auditFailureSchedulesDelayedRetryWithoutDlq() {
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID(), actorId = UUID.randomUUID(), correlationId = UUID.randomUUID();
        CustomerImportProcessor processor = mock(CustomerImportProcessor.class); CustomerImportStore store = mock(CustomerImportStore.class);
        CustomerImportProcessingAudit audit = mock(CustomerImportProcessingAudit.class); RabbitTemplate rabbit = mock(RabbitTemplate.class);
        CustomerImport completed = new CustomerImport(importId, tenantId, actorId, correlationId, "key", "file.csv", "text/csv", "1.0", true, "0".repeat(64), CustomerImport.Status.COMPLETED, 1, 0, Instant.now(), Instant.now(), Instant.now(), null);
        when(store.findById(tenantId, importId)).thenReturn(Optional.of(completed)); doThrow(new IllegalStateException("audit unavailable")).when(audit).record(any(), any(), any(), any(), any());
        var meters = new SimpleMeterRegistry(); var listener = new CustomerImportRequestedListener(processor, store, audit, JsonMapper.builder().build(), rabbit, meters.counter("processed"), meters.counter("failed"));
        listener.receive(envelope(importId, tenantId, null));
        verify(rabbit).send(eq("followupbussiness.events"), eq("customer-import.retry.v1"), any(Message.class));
        verify(rabbit, never()).send(eq("followupbussiness.events"), eq("customer-import.dlq.v1"), any(Message.class));
    }

    @Test void storeFailureSchedulesDelayedRetryWithoutDlq() {
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID();
        CustomerImportProcessor processor = mock(CustomerImportProcessor.class); CustomerImportStore store = mock(CustomerImportStore.class);
        CustomerImportProcessingAudit audit = mock(CustomerImportProcessingAudit.class); RabbitTemplate rabbit = mock(RabbitTemplate.class);
        when(store.findById(tenantId, importId)).thenThrow(new IllegalStateException("store unavailable"));
        var meters = new SimpleMeterRegistry(); var listener = new CustomerImportRequestedListener(processor, store, audit, JsonMapper.builder().build(), rabbit, meters.counter("processed"), meters.counter("failed"));
        listener.receive(envelope(importId, tenantId, null));
        verify(rabbit).send(eq("followupbussiness.events"), eq("customer-import.retry.v1"), any(Message.class));
        verify(rabbit, never()).send(eq("followupbussiness.events"), eq("customer-import.dlq.v1"), any(Message.class));
    }

    @Test void rebuildsAndClearsAuditContextFromThePersistedJob() {
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID(), actorId = UUID.randomUUID(), correlationId = UUID.randomUUID();
        CustomerImportProcessor processor = mock(CustomerImportProcessor.class); CustomerImportStore store = mock(CustomerImportStore.class);
        CustomerImportProcessingAudit audit = mock(CustomerImportProcessingAudit.class); RabbitTemplate rabbit = mock(RabbitTemplate.class);
        CustomerImport pending = new CustomerImport(importId, tenantId, actorId, correlationId, "key", "file.csv", "text/csv", "1.0", true, "0".repeat(64), CustomerImport.Status.PENDING, 0, 0, Instant.now(), null, null, null);
        CustomerImport completed = new CustomerImport(importId, tenantId, actorId, correlationId, "key", "file.csv", "text/csv", "1.0", true, "0".repeat(64), CustomerImport.Status.COMPLETED, 1, 0, Instant.now(), Instant.now(), Instant.now(), null);
        when(store.findById(tenantId, importId)).thenReturn(Optional.of(pending), Optional.of(completed));
        doAnswer(invocation -> {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            org.assertj.core.api.Assertions.assertThat(authentication.getPrincipal()).isEqualTo(new AuthenticatedActor(actorId, tenantId, BaseRole.COMPANY_ADMIN));
            org.assertj.core.api.Assertions.assertThat(authentication.getDetails()).isEqualTo(correlationId);
            return null;
        }).when(processor).process(importId, tenantId);
        var meters = new SimpleMeterRegistry(); var listener = new CustomerImportRequestedListener(processor, store, audit, JsonMapper.builder().build(), rabbit, meters.counter("processed"), meters.counter("failed"));

        listener.receive(envelope(importId, tenantId, null));

        verify(audit).record(tenantId, actorId, importId, correlationId, "COMPLETED");
        org.assertj.core.api.Assertions.assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    private static Message envelope(UUID importId, UUID tenantId, List<Map<String, Long>> deaths) {
        MessageProperties properties = new MessageProperties(); if (deaths != null) properties.setHeader("x-death", deaths);
        return new Message(("{\"payload\":{\"importId\":\"" + importId + "\",\"tenantId\":\"" + tenantId + "\"}}").getBytes(), properties);
    }
}
