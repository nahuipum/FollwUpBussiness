package com.nahui.followupbussiness.notifications.config;

import com.nahui.followupbussiness.notifications.adapter.out.persistence.JdbcInstallationRevocationAdapter;
import com.nahui.followupbussiness.notifications.application.RevokeInstallationsForSessionService;
import com.nahui.followupbussiness.notifications.application.port.in.RevokeInstallationsForSession;
import com.nahui.followupbussiness.notifications.application.ConsumeRouteNotificationService;
import com.nahui.followupbussiness.notifications.application.port.in.ConsumeRouteNotificationUseCase;
import com.nahui.followupbussiness.notifications.application.port.out.RoutePushGateway;
import com.nahui.followupbussiness.notifications.adapter.out.persistence.JdbcNotificationDeliveryStore;
import com.nahui.followupbussiness.notifications.adapter.in.messaging.RouteNotificationListener;
import com.nahui.followupbussiness.notifications.adapter.out.push.FcmRoutePushGateway;
import com.nahui.followupbussiness.routing.application.port.in.RouteNotificationAuthorizationUseCase;
import java.time.Clock;
import java.time.Duration;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import io.micrometer.core.instrument.MeterRegistry;
import tools.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import org.springframework.context.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(prefix = "followupbussiness.outbox", name = "enabled", havingValue = "true", matchIfMissing = true)
public class NotificationsConfiguration {
    @Bean
    RevokeInstallationsForSession revokeInstallationsForSession(JdbcTemplate j) {
        return new RevokeInstallationsForSessionService(new JdbcInstallationRevocationAdapter(j));
    }
    @Bean ConsumeRouteNotificationUseCase consumeRouteNotificationUseCase(JdbcTemplate jdbc, RouteNotificationAuthorizationUseCase routes, RoutePushGateway gateway) {
        return new ConsumeRouteNotificationService(new JdbcNotificationDeliveryStore(jdbc), routes, gateway, Clock.systemUTC(), Duration.ofMinutes(5));
    }
    @Bean @ConditionalOnProperty(prefix="followupbussiness.notifications.fcm", name="enabled", havingValue="true") RoutePushGateway fcmRoutePushGateway() throws java.io.IOException {
        FirebaseOptions options=FirebaseOptions.builder().setCredentials(GoogleCredentials.getApplicationDefault()).build();
        FirebaseApp app=FirebaseApp.getApps().isEmpty() ? FirebaseApp.initializeApp(options) : FirebaseApp.getInstance();
        return new FcmRoutePushGateway(FirebaseMessaging.getInstance(app));
    }
    @Bean @ConditionalOnProperty(prefix="followupbussiness.notifications.fcm", name="enabled", havingValue="false", matchIfMissing=true) RoutePushGateway disabledRoutePushGateway() { return request -> RoutePushGateway.Result.PERMANENT_FAILURE; }
    @Bean RouteNotificationListener routeNotificationListener(ConsumeRouteNotificationUseCase consumer, ObjectMapper json, RabbitTemplate rabbit, MeterRegistry meters) { return new RouteNotificationListener(consumer, json, rabbit, Clock.systemUTC(), meters); }
    @Bean Queue routeNotificationWorkQueue() { return QueueBuilder.durable("route.notifications.v1").ttl(86_400_000).deadLetterExchange("followupbussiness.events").deadLetterRoutingKey("route.notifications.dlq.v1").build(); }
    @Bean Queue routeNotificationDlq() { return QueueBuilder.durable("route.notifications.dlq.v1").ttl(86_400_000).build(); }
    @Bean Queue routeNotificationRetryQueue() { return QueueBuilder.durable("route.notifications.retry.v1").deadLetterExchange("followupbussiness.events").deadLetterRoutingKey("route.notifications.v1").build(); }
    @Bean Binding routeNotificationWorkBinding(Queue routeNotificationWorkQueue, TopicExchange outboxExchange) { return BindingBuilder.bind(routeNotificationWorkQueue).to(outboxExchange).with("route.*"); }
    @Bean Binding routeNotificationDlqBinding(Queue routeNotificationDlq, TopicExchange outboxExchange) { return BindingBuilder.bind(routeNotificationDlq).to(outboxExchange).with("route.notifications.dlq.v1"); }
    @Bean Binding routeNotificationRetryBinding(Queue routeNotificationRetryQueue, TopicExchange outboxExchange) { return BindingBuilder.bind(routeNotificationRetryQueue).to(outboxExchange).with("route.notifications.retry.v1"); }
}
