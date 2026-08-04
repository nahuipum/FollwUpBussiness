package com.nahui.followupbussiness.outbox.messaging;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import com.nahui.followupbussiness.outbox.adapter.out.messaging.RabbitMqEventTransport;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import com.nahui.followupbussiness.outbox.domain.UnroutablePublicationException;
import tools.jackson.databind.ObjectMapper;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OutboxRabbitMqIntegrationTest {
    private static final String VIRTUAL_HOST = "followupbussiness";
    private static final String USERNAME = "followupbussiness_local";
    private static final String PASSWORD = "BE055_TEST_ONLY_RABBIT_PASSWORD";
    private static final String EXCHANGE = "followupbussiness.events";
    private static final DockerImageName RABBIT_IMAGE = DockerImageName.parse("rabbitmq:4.1-management");

    private static GenericContainer<?> rabbitmq;
    private static CachingConnectionFactory connectionFactory;

    @BeforeAll
    static void startRabbitMq() {
        rabbitmq = new GenericContainer<>(RABBIT_IMAGE)
                .withExposedPorts(5672)
                .withEnv("RABBITMQ_DEFAULT_USER", USERNAME)
                .withEnv("RABBITMQ_DEFAULT_PASS", PASSWORD)
                .withEnv("RABBITMQ_DEFAULT_VHOST", VIRTUAL_HOST);
        rabbitmq.start();
        connectionFactory = new CachingConnectionFactory(rabbitmq.getHost(), rabbitmq.getMappedPort(5672));
        connectionFactory.setUsername(USERNAME);
        connectionFactory.setPassword(PASSWORD);
        connectionFactory.setVirtualHost(VIRTUAL_HOST);
        connectionFactory.setPublisherConfirmType(CachingConnectionFactory.ConfirmType.CORRELATED);
        connectionFactory.setPublisherReturns(true);
    }

    @AfterAll
    static void stopRabbitMq() {
        if (connectionFactory != null) {
            connectionFactory.destroy();
        }
        if (rabbitmq != null) {
            rabbitmq.stop();
        }
    }

    @Test
    void cleanBrokerDeclaresDurableOutboxExchangeBeforePublishing() {
        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        TopicExchange exchange = new TopicExchange(EXCHANGE, true, false);
        Queue queue = QueueBuilder.nonDurable("be055." + UUID.randomUUID()).build();
        admin.declareExchange(exchange);
        admin.declareQueue(queue);
        admin.declareBinding(BindingBuilder.bind(queue).to(exchange).with("visit.started"));
        RabbitTemplate template = new RabbitTemplate(connectionFactory);

        template.convertAndSend(EXCHANGE, "visit.started", "ready");

        Message received = template.receive(queue.getName(), 5_000);
        assertThat(received).isNotNull();
        assertThat(new String(received.getBody(), StandardCharsets.UTF_8)).isEqualTo("ready");
    }

    @Test
    void unroutableMessageIsReturnedAndIsNotReportedAsPublished() {
        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        admin.declareExchange(new TopicExchange(EXCHANGE, true, false));
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMandatory(true);
        OutboxEvent event = new OutboxEvent(UUID.randomUUID(), "unroutable.event", 1, java.time.Instant.now(),
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "{}");

        assertThat(org.assertj.core.api.Assertions.catchThrowable(
                () -> new RabbitMqEventTransport(template, new ObjectMapper(), EXCHANGE).publish(event)))
                .isInstanceOf(UnroutablePublicationException.class);
    }
}
