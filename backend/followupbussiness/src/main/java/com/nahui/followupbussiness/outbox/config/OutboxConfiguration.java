package com.nahui.followupbussiness.outbox.config;

import com.nahui.followupbussiness.outbox.adapter.in.scheduling.OutboxPublishingScheduler;
import com.nahui.followupbussiness.outbox.adapter.out.messaging.RabbitMqEventTransport;
import com.nahui.followupbussiness.outbox.adapter.out.persistence.JdbcOutboxStore;
import com.nahui.followupbussiness.outbox.application.OutboxPublisher;
import com.nahui.followupbussiness.outbox.application.port.out.EventTransport;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Gauge;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.Duration;
import java.util.Random;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
@ConditionalOnProperty(prefix = "fieldsales.outbox", name = "enabled", havingValue = "true", matchIfMissing = true)
public class OutboxConfiguration {
    @Bean
    @ConfigurationProperties(prefix = "fieldsales.outbox")
    public OutboxProperties outboxProperties() {
        return new OutboxProperties();
    }

    @Bean
    public OutboxStore outboxStore(JdbcTemplate jdbcTemplate) {
        return new JdbcOutboxStore(jdbcTemplate);
    }

    @Bean
    public EventTransport eventTransport(RabbitTemplate rabbitTemplate, ObjectMapper objectMapper, OutboxProperties properties) {
        return new RabbitMqEventTransport(rabbitTemplate, objectMapper, properties.exchange);
    }

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin rabbitAdmin = new RabbitAdmin(connectionFactory);
        rabbitAdmin.setAutoStartup(true);
        return rabbitAdmin;
    }

    @Bean
    public TopicExchange outboxExchange(OutboxProperties properties) {
        return new TopicExchange(properties.exchange, true, false);
    }

    @Bean
    public OutboxPublisher outboxPublisher(OutboxStore outboxStore, EventTransport eventTransport) {
        return new OutboxPublisher(outboxStore, eventTransport, Clock.systemUTC(), new Random());
    }

    @Bean
    public OutboxPublishingScheduler outboxPublishingScheduler(
            OutboxPublisher outboxPublisher, OutboxStore outboxStore, OutboxProperties properties, MeterRegistry meterRegistry) {
        Gauge.builder("outbox.backlog", outboxStore, store -> store.countReadyToPublish()).register(meterRegistry);
        Gauge.builder("outbox.oldest_pending_age_seconds", outboxStore,
                store -> store.oldestReadyAgeSeconds(Clock.systemUTC().instant())).register(meterRegistry);
        return new OutboxPublishingScheduler(
                outboxPublisher,
                properties.batchSize,
                Duration.ofSeconds(properties.leaseSeconds),
                meterRegistry.counter("outbox.events.published"),
                meterRegistry.counter("outbox.events.retry_scheduled"),
                meterRegistry.counter("outbox.events.terminal"),
                outboxStore,
                Clock.systemUTC(),
                meterRegistry.counter("outbox.events.retention_deleted"),
                meterRegistry.counter("outbox.publish.failures"));
    }

    public static final class OutboxProperties {
        private long pollDelayMs = 1000;
        private int batchSize = 50;
        private long leaseSeconds = 60;
        private String exchange = "fieldsales.events";

        public long getPollDelayMs() { return pollDelayMs; }
        public void setPollDelayMs(long pollDelayMs) { this.pollDelayMs = pollDelayMs; }
        public int getBatchSize() { return batchSize; }
        public void setBatchSize(int batchSize) { this.batchSize = batchSize; }
        public long getLeaseSeconds() { return leaseSeconds; }
        public void setLeaseSeconds(long leaseSeconds) { this.leaseSeconds = leaseSeconds; }
        public String getExchange() { return exchange; }
        public void setExchange(String exchange) { this.exchange = exchange; }
    }
}
