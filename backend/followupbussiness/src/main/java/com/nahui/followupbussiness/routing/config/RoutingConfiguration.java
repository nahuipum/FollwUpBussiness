package com.nahui.followupbussiness.routing.config;

import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcRouteStore;
import com.nahui.followupbussiness.routing.application.CreateRouteService;
import com.nahui.followupbussiness.routing.application.port.in.CreateRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.InvalidatePlanningSnapshotsUseCase;
import com.nahui.followupbussiness.routing.application.InvalidatePlanningSnapshotsService;
import com.nahui.followupbussiness.routing.application.port.in.CopyRouteUseCase;
import com.nahui.followupbussiness.routing.application.CopyRouteService;
import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.*;
import com.nahui.followupbussiness.routing.application.OptimizeRouteService;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcRouteProposalStore;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcRouteProposalRevisionStore;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcMatrixQuota;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcPlanningSnapshotStore;
import com.nahui.followupbussiness.routing.application.ReorderRoutePointsService;
import com.nahui.followupbussiness.routing.application.port.in.ReorderRoutePointsUseCase;
import com.nahui.followupbussiness.routing.application.port.in.PublishRouteUseCase;
import com.nahui.followupbussiness.routing.application.PublishRouteService;
import com.nahui.followupbussiness.routing.application.ReassignRouteService;
import com.nahui.followupbussiness.routing.application.port.in.ReassignRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.in.RouteNotificationAuthorizationUseCase;
import com.nahui.followupbussiness.routing.application.RouteNotificationAuthorizationService;
import com.nahui.followupbussiness.routing.application.ListSuggestedCustomersService;
import com.nahui.followupbussiness.routing.application.port.in.ListSuggestedCustomersUseCase;
import com.nahui.followupbussiness.routing.application.port.in.ReadRoutesUseCase;
import com.nahui.followupbussiness.routing.application.ReadRoutesService;
import com.nahui.followupbussiness.routing.application.GetRouteDirectionsService;
import com.nahui.followupbussiness.routing.application.port.in.GetRouteDirectionsUseCase;
import com.nahui.followupbussiness.routing.adapter.out.directions.MapboxDirectionsAdapter;
import com.nahui.followupbussiness.routing.adapter.out.matrix.MapboxMatrixAdapter;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.journeys.application.port.in.JourneyStartedStatusUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.TerritoryReferenceUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.CurrentCompanyQuery;

import java.time.Clock;
import java.time.Duration;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration(proxyBeanMethods = false)
public class RoutingConfiguration {
    @Bean
    ReadRoutesUseCase readRoutesUseCase(JdbcTemplate jdbc, PortfolioAccessScopeUseCase scopes, SellerReferenceUseCase sellers) {
        return new ReadRoutesService(new JdbcRouteStore(jdbc), scopes, sellers);
    }
    @Bean
    RouteDirections routeDirections(tools.jackson.databind.ObjectMapper json, Environment environment) {
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
        String token = mapboxDirectionsToken(environment);
        return new MapboxDirectionsAdapter(token, URI.create("https://api.mapbox.com/directions/v5"), uri -> {
            HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5)).GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return new MapboxDirectionsAdapter.Response(response.statusCode(), response.body());
        }, json);
    }

    static String mapboxDirectionsToken(Environment environment) {
        String dedicated = environment.getProperty("MAPBOX_DIRECTIONS_TOKEN");
        return dedicated == null || dedicated.isBlank()
                ? environment.getProperty("FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX")
                : dedicated;
    }
    @Bean
    GetRouteDirectionsUseCase getRouteDirectionsUseCase(ReadRoutesUseCase routes, RouteDirections directions) {
        return new GetRouteDirectionsService(routes, directions);
    }
    @Bean
    ListSuggestedCustomersUseCase listSuggestedCustomersUseCase(CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes) {
        return new ListSuggestedCustomersService(customers, sellers, scopes);
    }
    @Bean
    RouteNotificationAuthorizationUseCase routeNotificationAuthorizationUseCase(JdbcTemplate jdbc) {
        return new RouteNotificationAuthorizationService(new JdbcRouteStore(jdbc));
    }
    @Bean
    TravelMatrix travelMatrix(tools.jackson.databind.ObjectMapper json, Environment environment) {
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
        return new MapboxMatrixAdapter(mapboxMatrixToken(environment), URI.create("https://api.mapbox.com/directions-matrix/v1"), uri -> {
            HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5)).GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return new MapboxMatrixAdapter.Response(response.statusCode(), response.body());
        }, json);
    }

    static String mapboxMatrixToken(Environment environment) {
        String dedicated = environment.getProperty("MAPBOX_MATRIX_TOKEN");
        return dedicated == null || dedicated.isBlank() ? environment.getProperty("FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX") : dedicated;
    }

    @Bean
    OptimizeRouteUseCase optimizeRouteUseCase(JdbcTemplate jdbc, CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes, TravelMatrix matrix, PlatformTransactionManager transactions) {
        var service = new OptimizeRouteService(new JdbcRouteStore(jdbc), new JdbcRouteProposalStore(jdbc), matrix, customers, sellers, scopes, new JdbcMatrixQuota(jdbc, transactions), Clock.systemUTC());
        var transaction = new TransactionTemplate(transactions);
        return (command, actor) -> transaction.execute(status -> service.optimize(command, actor));
    }

    @Bean
    InvalidatePlanningSnapshotsUseCase invalidatePlanningSnapshotsUseCase(JdbcTemplate jdbc, tools.jackson.databind.ObjectMapper json) {
        return new InvalidatePlanningSnapshotsService(new JdbcPlanningSnapshotStore(jdbc, json));
    }
    @Bean
    CreateRouteUseCase createRouteUseCase(JdbcTemplate jdbc, tools.jackson.databind.ObjectMapper json, CustomerPortfolioReadUseCase customers,
                                          SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes, CurrentCompanyQuery companies,
                                          TravelMatrix matrix, @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit,
                                          PlatformTransactionManager transactions) {
        var service = new CreateRouteService(new JdbcRouteStore(jdbc), new JdbcPlanningSnapshotStore(jdbc, json), matrix, companies, customers, sellers, scopes, audit, Clock.systemUTC());
        var transaction = new TransactionTemplate(transactions);
        transaction.setIsolationLevel(org.springframework.transaction.TransactionDefinition.ISOLATION_SERIALIZABLE);
        return (command, actor) -> transaction.execute(status -> service.create(command, actor));
    }

    @Bean
    CopyRouteUseCase copyRouteUseCase(JdbcTemplate jdbc, CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers,
                                      TerritoryReferenceUseCase territories, PortfolioAccessScopeUseCase scopes,
                                      @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit,
                                      PlatformTransactionManager transactions) {
        var service = new CopyRouteService(new JdbcRouteStore(jdbc), customers, sellers, territories, scopes, audit, Clock.systemUTC());
        var transaction = new TransactionTemplate(transactions);
        transaction.setIsolationLevel(org.springframework.transaction.TransactionDefinition.ISOLATION_SERIALIZABLE);
        return (command, actor) -> transaction.execute(status -> service.copy(command, actor));
    }

    @Bean
    ReorderRoutePointsUseCase reorderRoutePointsUseCase(JdbcTemplate jdbc, tools.jackson.databind.ObjectMapper json, PortfolioAccessScopeUseCase scopes,
                                                         @Qualifier("transactionalAuditEntryUseCase") RecordAuditEntryUseCase audit,
                                                         JourneyStartedStatusUseCase journeys, ObjectProvider<OutboxStore> outbox,
                                                         PlatformTransactionManager transactions) {
        var service = new ReorderRoutePointsService(new JdbcRouteStore(jdbc), new JdbcPlanningSnapshotStore(jdbc, json), scopes, audit, journeys, outbox.getIfAvailable(), new JdbcRouteProposalRevisionStore(jdbc), Clock.systemUTC());
        var transaction = new TransactionTemplate(transactions);
        transaction.setIsolationLevel(org.springframework.transaction.TransactionDefinition.ISOLATION_SERIALIZABLE);
        return (command, actor) -> transaction.execute(status -> service.reorder(command, actor));
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
