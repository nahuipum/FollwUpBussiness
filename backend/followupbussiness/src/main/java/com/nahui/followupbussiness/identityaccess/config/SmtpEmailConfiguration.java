package com.nahui.followupbussiness.identityaccess.config;

import com.nahui.followupbussiness.identityaccess.adapter.out.email.SmtpTransactionalEmailGateway;
import com.nahui.followupbussiness.identityaccess.adapter.in.scheduling.IdentityNotificationDeliveryScheduler;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcIdentityNotificationAdapter;
import com.nahui.followupbussiness.identityaccess.application.IdentityNotificationDeliveryWorker;
import com.nahui.followupbussiness.identityaccess.application.port.out.TransactionalEmailGateway;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.util.Random;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(prefix = "followupbussiness.email", name = "enabled", havingValue = "true")
public class SmtpEmailConfiguration {
    @Bean
    TransactionalEmailGateway transactionalEmailGateway(JavaMailSender sender, @Value("${followupbussiness.email.from}") String from, @Value("${followupbussiness.email.activation-url:http://localhost:5173/password-reset}") String activationUrl) {
        return new SmtpTransactionalEmailGateway(sender, from, activationUrl);
    }

    @Bean
    IdentityNotificationDeliveryWorker identityNotificationDeliveryWorker(JdbcTemplate jdbc,
            @Value("${followupbussiness.authentication.hmac-secret}") String hmacSecret,
            TransactionalEmailGateway gateway) {
        return new IdentityNotificationDeliveryWorker(
                new JdbcIdentityNotificationAdapter(jdbc, hmacSecret.getBytes(StandardCharsets.UTF_8)), gateway,
                Clock.systemUTC(), new Random(), Duration.ofSeconds(1), Duration.ofMinutes(5));
    }

    @Bean
    IdentityNotificationDeliveryScheduler identityNotificationDeliveryScheduler(IdentityNotificationDeliveryWorker worker) {
        return new IdentityNotificationDeliveryScheduler(worker);
    }
}
