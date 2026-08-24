package com.nahui.followupbussiness.imports.adapter.in.messaging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nahui.followupbussiness.imports.application.CustomerImportProcessor;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportProcessingAudit;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;
import tools.jackson.databind.json.JsonMapper;

class CustomerImportRabbitMqIntegrationTest {
    private static final String EXCHANGE = "followupbussiness.events";
    private static final String WORK = "customer-import.requested.v1";
    private static final String RETRY = "customer-import.retry.v1";
    private static final String DLQ = "customer-import.dlq.v1";
    private static GenericContainer<?> broker;
    private static CachingConnectionFactory connections;

    @BeforeAll
    static void startBroker() {
        broker = new GenericContainer<>(DockerImageName.parse("rabbitmq:4.2.9-management-alpine"))
                .withExposedPorts(5672)
                .withEnv("RABBITMQ_DEFAULT_USER", "be019")
                .withEnv("RABBITMQ_DEFAULT_PASS", "BE019_TEST_ONLY_PASSWORD")
                .withEnv("RABBITMQ_DEFAULT_VHOST", "be019");
        broker.start();
        connections = new CachingConnectionFactory(broker.getHost(), broker.getMappedPort(5672));
        connections.setUsername("be019");
        connections.setPassword("BE019_TEST_ONLY_PASSWORD");
        connections.setVirtualHost("be019");
        var admin = new RabbitAdmin(connections);
        var exchange = new TopicExchange(EXCHANGE, true, false);
        admin.declareExchange(exchange);
        var work = QueueBuilder.durable(WORK).deadLetterExchange(EXCHANGE).deadLetterRoutingKey(RETRY).build();
        var retry = QueueBuilder.durable(RETRY).ttl(250).deadLetterExchange(EXCHANGE).deadLetterRoutingKey(WORK).build();
        var dlq = QueueBuilder.durable(DLQ).build();
        admin.declareQueue(work); admin.declareQueue(retry); admin.declareQueue(dlq);
        admin.declareBinding(BindingBuilder.bind(work).to(exchange).with(WORK));
        admin.declareBinding(BindingBuilder.bind(retry).to(exchange).with(RETRY));
        admin.declareBinding(BindingBuilder.bind(dlq).to(exchange).with(DLQ));
    }

    @AfterAll
    static void stopBroker() {
        if (connections != null) connections.destroy();
        if (broker != null) broker.stop();
    }

    @Test
    void postClaimFailureUsesThreeTtlRetriesThenFailsAuditsCountsAndDlqsOnce() {
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID(), actorId = UUID.randomUUID(), correlationId = UUID.randomUUID();
        CustomerImportProcessor processor = mock(CustomerImportProcessor.class);
        CustomerImportStore store = mock(CustomerImportStore.class);
        CustomerImportProcessingAudit audit = mock(CustomerImportProcessingAudit.class);
        doThrow(new IllegalStateException("post-claim failure")).when(processor).process(importId, tenantId);
        CustomerImport failed = new CustomerImport(importId, tenantId, actorId, correlationId, "key", "file.csv", "text/csv", "1.0", true, "0".repeat(64), CustomerImport.Status.FAILED, 0, 0, Instant.now(), Instant.now(), Instant.now(), Instant.now());
        when(processor.failAfterDeliveryExhausted(importId, tenantId)).thenReturn(java.util.Optional.of(failed));
        var meters = new SimpleMeterRegistry();
        RabbitTemplate rabbit = new RabbitTemplate(connections);
        var listener = new CustomerImportRequestedListener(processor, store, audit, JsonMapper.builder().build(), rabbit, meters.counter("customer_imports.processed"), meters.counter("customer_imports.failed"));
        rabbit.convertAndSend(EXCHANGE, WORK, envelope(importId, tenantId));

        Instant previous = Instant.now();
        for (int delivery = 0; delivery < 4; delivery++) {
            Message message = rabbit.receive(WORK, 5_000);
            assertThat(message).as("entrega %s", delivery + 1).isNotNull();
            if (delivery == 3) assertThat(message.getMessageProperties().getHeaders()).containsEntry("x-customer-import-delivery", 3L);
            if (delivery > 0) assertThat(Duration.between(previous, Instant.now())).isGreaterThanOrEqualTo(Duration.ofMillis(200));
            previous = Instant.now();
            listener.receive(message);
        }

        assertThat(rabbit.receive(DLQ, 5_000)).isNotNull();
        assertThat(rabbit.receive(DLQ, 300)).isNull();
        assertThat(rabbit.receive(RETRY, 300)).isNull();
        assertThat(rabbit.receive(WORK, 300)).isNull();
        verify(processor, times(3)).process(importId, tenantId);
        verify(processor).failAfterDeliveryExhausted(importId, tenantId);
        verify(audit).record(tenantId, actorId, importId, correlationId, "FAILED");
        assertThat(meters.counter("customer_imports.failed").count()).isEqualTo(1d);
    }

    private static String envelope(UUID importId, UUID tenantId) {
        return "{\"payload\":{\"importId\":\"" + importId + "\",\"tenantId\":\"" + tenantId + "\"}}";
    }
}
