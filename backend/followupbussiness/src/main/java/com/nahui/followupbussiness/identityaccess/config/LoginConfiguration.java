package com.nahui.followupbussiness.identityaccess.config;

import com.nahui.followupbussiness.identityaccess.adapter.in.rest.LoginRateLimiter;
import com.nahui.followupbussiness.identityaccess.adapter.in.rest.RefreshRateLimiter;
import com.nahui.followupbussiness.identityaccess.adapter.in.rest.LoginRequestSizeFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.*;
import com.nahui.followupbussiness.identityaccess.adapter.out.security.*;
import com.nahui.followupbussiness.identityaccess.application.*;
import com.nahui.followupbussiness.identityaccess.application.port.out.*;
import com.nahui.followupbussiness.identityaccess.application.port.in.RefreshSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.LogoutSessionUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuthenticationAuditUseCase;
import com.nahui.followupbussiness.notifications.application.port.in.RevokeInstallationsForSession;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.time.Clock;
import java.util.Base64;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(prefix = "followupbussiness.authentication", name = "rs256-private-key")
@EnableConfigurationProperties(AuthenticationProperties.Values.class)
public class LoginConfiguration {
    @Bean
    LoginService loginService(JdbcTemplate j, CompanyAccessStatusQuery c, AuthenticationProperties.Values p) {
        try {
            if (p.getKid() == null || p.getKid().isBlank() || p.getIssuer() == null || p.getIssuer().isBlank() || p.getAudience() == null || p.getAudience().isBlank() || p.getWebOrigin() == null || p.getWebOrigin().isBlank() || p.getHmacSecret() == null || p.getHmacSecret().length() < 32)
                throw new IllegalStateException("Authentication signing configuration is incomplete");
            PrivateKey k = KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(p.getRs256PrivateKey())));
            if (!"RSA".equals(k.getAlgorithm())) throw new IllegalStateException("Authentication key must be RSA");
            return new LoginService(new JdbcLoginAccountQuery(j), new BCryptPasswordHashingAdapter(), c, new JdbcSessionFamilyAdapter(j), new Rs256AccessTokenAdapter(k, p.getKid(), p.getIssuer(), p.getAudience(), Clock.systemUTC()), Clock.systemUTC(), p.getHmacSecret().getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException | GeneralSecurityException e) {
            throw new IllegalStateException("Invalid RS256 authentication key", e);
        }
    }

    @Bean
    LoginRateLimiter loginRateLimiter(StringRedisTemplate redis, AuthenticationProperties.Values p) {
        return new LoginRateLimiter(redis, p.getHmacSecret().getBytes(StandardCharsets.UTF_8));
    }

    @Bean
    InboundJwtAuthenticator inboundJwtAuthenticator(JdbcTemplate j, AuthenticationProperties.Values p) {
        try {
            PrivateKey privateKey = KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(p.getRs256PrivateKey())));
            if (!(privateKey instanceof java.security.interfaces.RSAPrivateCrtKey rsa))
                throw new IllegalStateException("Authentication key must expose RSA public components");
            PublicKey publicKey = KeyFactory.getInstance("RSA").generatePublic(new RSAPublicKeySpec(rsa.getModulus(), rsa.getPublicExponent()));
            return new InboundJwtAuthenticator(publicKey, p.getIssuer(), p.getAudience(), j, Clock.systemUTC());
        } catch (IllegalArgumentException | GeneralSecurityException e) {
            throw new IllegalStateException("Invalid RS256 authentication key", e);
        }
    }

    @Bean
    LoginRequestSizeFilter loginRequestSizeFilter() {
        return new LoginRequestSizeFilter();
    }

    @Bean
    RefreshSessionUseCase refreshSessionUseCase(JdbcTemplate j, CompanyAccessStatusQuery c, AuthenticationProperties.Values p,
                                                RecordAuthenticationAuditUseCase audit, RefreshRateLimiter limiter) {
        try {
            PrivateKey k = KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(p.getRs256PrivateKey())));
            var service = new RefreshService(new JdbcRefreshSessionAdapter(j), new JdbcLoginAccountQuery(j), c,
                    new Rs256AccessTokenAdapter(k, p.getKid(), p.getIssuer(), p.getAudience(), Clock.systemUTC()), audit, limiter,
                    Clock.systemUTC(), p.getHmacSecret().getBytes(StandardCharsets.UTF_8));
            var transaction = new TransactionTemplate(new DataSourceTransactionManager(j.getDataSource()));
            return command -> {
                Object outcome = java.util.Objects.requireNonNull(transaction.execute(status -> {
                    try { return service.refresh(command); }
                    catch (RefreshService.Rejected rejected) { return rejected; }
                }));
                if (outcome instanceof RefreshService.Rejected rejected) throw rejected;
                return (RefreshService.Result) outcome;
            };
        } catch (IllegalArgumentException | GeneralSecurityException e) { throw new IllegalStateException("Invalid RS256 authentication key", e); }
    }

    @Bean
    LogoutSessionUseCase logoutSessionUseCase(JdbcTemplate j, RecordAuthenticationAuditUseCase audit, StringRedisTemplate redis, RevokeInstallationsForSession installations, AuthenticationProperties.Values p) {
        var secret = p.getHmacSecret().getBytes(StandardCharsets.UTF_8);
        var service = new LogoutSessionService(new JdbcRefreshSessionAdapter(j), audit, new RedisLogoutAbuseMonitor(redis, secret), installations, Clock.systemUTC(), secret);
        var transaction = new TransactionTemplate(new DataSourceTransactionManager(j.getDataSource()));
        return command -> transaction.executeWithoutResult(status -> service.logout(command));
    }

    @Bean
    RefreshRateLimiter refreshRateLimiter(StringRedisTemplate redis, AuthenticationProperties.Values p) {
        return new RefreshRateLimiter(redis, p.getHmacSecret().getBytes(StandardCharsets.UTF_8));
    }

    @Bean
    ResourceAccessAuthorizer resourceAccessAuthorizer(JdbcTemplate jdbcTemplate) {
        return new ResourceAccessAuthorizer(new JdbcTeamMembershipQuery(jdbcTemplate), new JdbcResourceAccessGrantQuery(jdbcTemplate), new JdbcAccessDecisionAuditAdapter(jdbcTemplate));
    }
}
