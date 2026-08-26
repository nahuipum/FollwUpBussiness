package com.nahui.followupbussiness.routing.config;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcRouteStore;
import com.nahui.followupbussiness.routing.application.CreateRouteService;
import com.nahui.followupbussiness.routing.application.port.in.CreateRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.*;
import com.nahui.followupbussiness.routing.application.OptimizeRouteService;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcRouteProposalStore;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcMatrixQuota;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcPlanningSnapshotStore;
import com.nahui.followupbussiness.routing.application.ReorderRoutePointsService;
import com.nahui.followupbussiness.routing.application.port.in.ReorderRoutePointsUseCase;
import com.nahui.followupbussiness.routing.application.port.in.PublishRouteUseCase;
import com.nahui.followupbussiness.routing.application.PublishRouteService;
import com.nahui.followupbussiness.routing.application.ReassignRouteService;
import com.nahui.followupbussiness.routing.application.port.in.ReassignRouteUseCase;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;

import java.time.Clock;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration(proxyBeanMethods = false)
public class RoutingConfiguration {
    @Bean
    TravelMatrix travelMatrix() {
        return coordinates -> {
            throw new OptimizeRouteUseCase.Unavailable();
        };
    }

    @Bean
    OptimizeRouteUseCase optimizeRouteUseCase(JdbcTemplate jdbc, CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes, TravelMatrix matrix, PlatformTransactionManager transactions) {
        var service = new OptimizeRouteService(new JdbcRouteStore(jdbc), new JdbcRouteProposalStore(jdbc), matrix, customers, sellers, scopes, new JdbcMatrixQuota(jdbc, transactions), Clock.systemUTC());
        var transaction = new TransactionTemplate(transactions);
        return (command, actor) -> transaction.execute(status -> service.optimize(command, actor));
    }

    @Bean
    CreateRouteUseCase createRouteUseCase(JdbcTemplate jdbc, CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes, @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit) {
        return new CreateRouteService(new JdbcRouteStore(jdbc), customers, sellers, scopes, audit, Clock.systemUTC());
    }

    @Bean
    ReorderRoutePointsUseCase reorderRoutePointsUseCase(JdbcTemplate jdbc, tools.jackson.databind.ObjectMapper json, PortfolioAccessScopeUseCase scopes, @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit) {
        return new ReorderRoutePointsService(new JdbcRouteStore(jdbc), new JdbcPlanningSnapshotStore(jdbc, json), scopes, audit, Clock.systemUTC());
    }

    @Bean
    @ConditionalOnProperty(prefix = "followupbussiness.outbox", name = "enabled", havingValue = "true", matchIfMissing = true)
    PublishRouteUseCase publishRouteUseCase(JdbcTemplate jdbc, tools.jackson.databind.ObjectMapper json, SellerReferenceUseCase sellers,
                                            PortfolioAccessScopeUseCase scopes, OutboxStore outbox,
                                            @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit,
                                            PlatformTransactionManager transactions) {
        var service = new PublishRouteService(new JdbcRouteStore(jdbc), new JdbcPlanningSnapshotStore(jdbc, json), sellers, scopes, outbox, audit, Clock.systemUTC());
        var transaction = new TransactionTemplate(transactions);
        transaction.setIsolationLevel(org.springframework.transaction.TransactionDefinition.ISOLATION_SERIALIZABLE);
        return (command, actor) -> transaction.execute(status -> service.publish(command, actor));
    }

    @Bean
    @ConditionalOnProperty(prefix = "followupbussiness.outbox", name = "enabled", havingValue = "false")
    PublishRouteUseCase unavailablePublishRouteUseCase() {
        return (command, actor) -> { throw new PublishRouteUseCase.Unavailable(); };
    }

    @Bean
    @ConditionalOnProperty(prefix = "followupbussiness.outbox", name = "enabled", havingValue = "true", matchIfMissing = true)
    ReassignRouteUseCase reassignRouteUseCase(JdbcTemplate jdbc, SellerReferenceUseCase sellers,
                                              PortfolioAccessScopeUseCase scopes, OutboxStore outbox,
                                              @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit,
                                              PlatformTransactionManager transactions) {
        var service = new ReassignRouteService(new JdbcRouteStore(jdbc), sellers, scopes, outbox, audit, Clock.systemUTC());
        var transaction = new TransactionTemplate(transactions);
        transaction.setIsolationLevel(org.springframework.transaction.TransactionDefinition.ISOLATION_SERIALIZABLE);
        return (command, actor) -> transaction.execute(status -> service.reassign(command, actor));
    }

    @Bean
    @ConditionalOnProperty(prefix = "followupbussiness.outbox", name = "enabled", havingValue = "false")
    ReassignRouteUseCase unavailableReassignRouteUseCase() {
        return (command, actor) -> { throw new ReassignRouteUseCase.Unavailable(); };
    }
}
