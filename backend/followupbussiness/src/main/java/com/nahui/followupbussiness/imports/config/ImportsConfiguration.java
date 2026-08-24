package com.nahui.followupbussiness.imports.config;

import com.nahui.followupbussiness.imports.application.CustomerImportTemplateService;
import com.nahui.followupbussiness.imports.application.CustomerImportService;
import com.nahui.followupbussiness.imports.application.port.in.DownloadCustomerImportTemplateUseCase;
import com.nahui.followupbussiness.imports.adapter.out.persistence.JdbcCustomerImportStore;
import com.nahui.followupbussiness.imports.adapter.out.audit.AuditCustomerImportProcessing;
import com.nahui.followupbussiness.imports.adapter.in.messaging.CustomerImportRequestedListener;
import com.nahui.followupbussiness.imports.adapter.in.scheduling.CustomerImportRetentionScheduler;
import com.nahui.followupbussiness.imports.application.CustomerImportProcessor;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportProcessingAudit;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.application.CheckCustomerDuplicatesService;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import tools.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class ImportsConfiguration {
    private static final int MAX_MESSAGE_TTL_MS = 86_400_000;
    @Bean DownloadCustomerImportTemplateUseCase downloadCustomerImportTemplateUseCase() { return new CustomerImportTemplateService(); }
    @Bean CustomerImportService customerImportService(JdbcTemplate jdbc, OutboxStore outbox, RecordAuditEntryUseCase audit, MeterRegistry meters) { return new CustomerImportService(new JdbcCustomerImportStore(jdbc), outbox, Clock.systemUTC(), audit, meters.counter("customer_imports.errors.downloaded")); }
    @Bean CustomerImportStore customerImportStore(JdbcTemplate jdbc) { return new JdbcCustomerImportStore(jdbc); }
    @Bean CustomerImportProcessor customerImportProcessor(CustomerImportStore store, CreateCustomerService customers, CheckCustomerDuplicatesService duplicates) { return new CustomerImportProcessor(store, customers, duplicates); }
    @Bean CustomerImportProcessingAudit customerImportProcessingAudit(AuditEntryStore store) { return new AuditCustomerImportProcessing(store, Clock.systemUTC()); }
    @Bean CustomerImportRequestedListener customerImportRequestedListener(CustomerImportProcessor processor, CustomerImportStore store, CustomerImportProcessingAudit audit, ObjectMapper json, org.springframework.amqp.rabbit.core.RabbitTemplate rabbit, MeterRegistry meters) { return new CustomerImportRequestedListener(processor, store, audit, json, rabbit, meters.counter("customer_imports.processed"), meters.counter("customer_imports.failed")); }
    @Bean CustomerImportRetentionScheduler customerImportRetentionScheduler(CustomerImportStore store, MeterRegistry meters) { return new CustomerImportRetentionScheduler(store, meters.counter("customer_imports.files.retention_deleted"), meters.counter("customer_imports.results.retention_deleted")); }
    @Bean Queue customerImportWorkQueue() { return QueueBuilder.durable("customer-import.requested.v1").ttl(MAX_MESSAGE_TTL_MS).deadLetterExchange("followupbussiness.events").deadLetterRoutingKey("customer-import.retry.v1").build(); }
    @Bean Queue customerImportRetryQueue() { return QueueBuilder.durable("customer-import.retry.v1").ttl(1_000).deadLetterExchange("followupbussiness.events").deadLetterRoutingKey("customer-import.requested.v1").build(); }
    @Bean Queue customerImportDlq() { return QueueBuilder.durable("customer-import.dlq.v1").ttl(MAX_MESSAGE_TTL_MS).build(); }
    @Bean Binding customerImportWorkBinding(Queue customerImportWorkQueue, TopicExchange outboxExchange) { return BindingBuilder.bind(customerImportWorkQueue).to(outboxExchange).with("customer-import.requested.v1"); }
    @Bean Binding customerImportRetryBinding(Queue customerImportRetryQueue, TopicExchange outboxExchange) { return BindingBuilder.bind(customerImportRetryQueue).to(outboxExchange).with("customer-import.retry.v1"); }
    @Bean Binding customerImportDlqBinding(Queue customerImportDlq, TopicExchange outboxExchange) { return BindingBuilder.bind(customerImportDlq).to(outboxExchange).with("customer-import.dlq.v1"); }
}
