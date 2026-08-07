package com.nahui.followupbussiness.identityaccess.config;

import com.nahui.followupbussiness.identityaccess.adapter.in.rest.LoginRateLimiter;
import com.nahui.followupbussiness.identityaccess.adapter.in.rest.PasswordRecoveryRateLimiter;
import com.nahui.followupbussiness.identityaccess.adapter.in.rest.RefreshRateLimiter;
import com.nahui.followupbussiness.identityaccess.adapter.in.rest.LoginRequestSizeFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.rest.PasswordRecoveryRequestSizeFilter;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.adapter.in.scheduling.IdentityNotificationDeliveryScheduler;
import com.nahui.followupbussiness.identityaccess.adapter.in.scheduling.PasswordRecoveryRequestScheduler;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.*;
import com.nahui.followupbussiness.identityaccess.adapter.out.security.*;
import com.nahui.followupbussiness.identityaccess.application.*;
import com.nahui.followupbussiness.identityaccess.application.port.out.*;
import com.nahui.followupbussiness.identityaccess.application.port.in.RefreshSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.LogoutSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.ProvisionInitialCompanyAdminUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuthenticationAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAuditCommand;
import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAuditCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.audit.domain.AuditScope;
import com.nahui.followupbussiness.notifications.application.port.in.RevokeInstallationsForSession;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.TransactionDefinition;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.time.Clock;
import java.time.Duration;
import java.util.Random;
import java.util.Base64;
import java.util.UUID;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(prefix = "followupbussiness.authentication", name = "rs256-private-key")
@EnableConfigurationProperties(AuthenticationProperties.Values.class)
@EnableScheduling
public class LoginConfiguration {
    @Bean
    public CompanyUserService companyUserService(JdbcTemplate jdbc, AuthenticationProperties.Values properties) {
        byte[] secret = properties.getHmacSecret().getBytes(StandardCharsets.UTF_8);
        var delegate = new CompanyUserService(jdbc, Clock.systemUTC(), new JdbcPasswordRecoveryAdapter(jdbc), new JdbcIdentityNotificationAdapter(jdbc, secret),
                new JdbcCompanyUserAuditStore(jdbc), new JdbcCompanyUserOutboxStore(jdbc), secret);
        var transaction = new TransactionTemplate(new DataSourceTransactionManager(jdbc.getDataSource()));
        var deniedTransaction = new TransactionTemplate(new DataSourceTransactionManager(jdbc.getDataSource()));
        deniedTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        var denialStore = new JdbcCompanyUserAuditStore(jdbc);
        return new CompanyUserService(jdbc, Clock.systemUTC()) {
            @Override public CompanyUserService.UserPage list(int page, int pageSize, String search, BaseRole role, String status, com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor actor) { try { return delegate.list(page,pageSize,search,role,status,actor); } catch (CompanyUserService.Forbidden denied) { denial(actor, actor == null ? null : actor.accountId(), new java.util.UUID(0L,0L)); throw denied; } }
            @Override public CompanyUserService.User get(java.util.UUID id, com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor actor) { return get(id,actor,new java.util.UUID(0L,0L)); }
            @Override public CompanyUserService.User get(java.util.UUID id, com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor actor, java.util.UUID correlation) { try { return delegate.get(id,actor,correlation); } catch (CompanyUserService.Forbidden | CompanyUserService.NotFound denied) { denial(actor,id,correlation); throw denied; } }
            @Override public CompanyUserService.User invite(CompanyUserService.Invite c, com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor a) { return invite(c,a,new java.util.UUID(0L,0L)); }
            @Override public CompanyUserService.User invite(CompanyUserService.Invite c, com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor a, java.util.UUID correlation) { try { return java.util.Objects.requireNonNull(transaction.execute(s -> delegate.invite(c,a,correlation))); } catch (CompanyUserService.Forbidden denied) { denial(a,a == null ? null : a.accountId(),correlation); throw denied; } }
            @Override public CompanyUserService.User update(java.util.UUID id, CompanyUserService.Update c, com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor a) { return update(id,c,a,new java.util.UUID(0L,0L)); }
            @Override public CompanyUserService.User update(java.util.UUID id, CompanyUserService.Update c, com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor a, java.util.UUID correlation) { try { return java.util.Objects.requireNonNull(transaction.execute(s -> delegate.update(id,c,a,correlation))); } catch (CompanyUserService.Forbidden | CompanyUserService.NotFound denied) { denial(a,id,correlation); throw denied; } }
            @Override public CompanyUserService.User status(java.util.UUID id, String target, com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor a) { return status(id,target,a,new java.util.UUID(0L,0L)); }
            @Override public CompanyUserService.User status(java.util.UUID id, String target, com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor a, java.util.UUID correlation) { try { return java.util.Objects.requireNonNull(transaction.execute(s -> delegate.status(id,target,a,correlation))); } catch (CompanyUserService.Forbidden | CompanyUserService.NotFound denied) { denial(a,id,correlation); throw denied; } }
            private void denial(com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor actor, java.util.UUID resource, java.util.UUID correlation) {
                if (actor == null || actor.accountId() == null || actor.tenantId() == null) return;
                java.util.UUID safeResource = resource == null ? actor.accountId() : resource;
                deniedTransaction.executeWithoutResult(s -> denialStore.append(new AuditEntry(java.util.UUID.randomUUID(), actor.tenantId(), actor.accountId(), AuditAction.CRITICAL_MUTATION,
                        "COMPANY_USER", safeResource, AuditResult.DENIED, correlation, AuditScope.TENANT_BOUND_DENIAL.name(), java.util.Map.of(), java.util.Map.of(), Clock.systemUTC().instant())));
            }
        };
    }
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
    PasswordRecoveryRateLimiter passwordRecoveryRateLimiter(StringRedisTemplate redis, AuthenticationProperties.Values p) {
        return new PasswordRecoveryRateLimiter(redis, p.getHmacSecret().getBytes(StandardCharsets.UTF_8));
    }

    @Bean
    PasswordRecoveryService passwordRecoveryService(JdbcTemplate jdbc, AuthenticationProperties.Values p) {
        byte[] secret = p.getHmacSecret().getBytes(StandardCharsets.UTF_8);
        var transaction = new TransactionTemplate(new DataSourceTransactionManager(jdbc.getDataSource()));
        var requests = new JdbcPasswordRecoveryRequestAdapter(jdbc, secret);
        return new PasswordRecoveryService(new JdbcPasswordRecoveryAdapter(jdbc), requests, new JdbcIdentityNotificationAdapter(jdbc, secret),
                new JdbcRefreshSessionAdapter(jdbc), new BCryptPasswordHashingAdapter(), Clock.systemUTC(), secret) {
            @Override
            public void accept(String identifier) {
                transaction.executeWithoutResult(status -> super.accept(identifier));
            }

            @Override
            public void request(String identifier) {
                transaction.executeWithoutResult(status -> super.request(identifier));
            }

            @Override
            public void reset(String token, char[] password) {
                transaction.executeWithoutResult(status -> super.reset(token, password));
            }
        };
    }

    @Bean
    ProvisionInitialCompanyAdminUseCase provisionInitialCompanyAdminUseCase(JdbcTemplate jdbc, CompanyAccessStatusQuery companies,
            AuthenticationProperties.Values p, RecordPlatformCompanyAuditUseCase audit, RecordCompanyDenialAuditUseCase denialAudit) {
        byte[] secret = p.getHmacSecret().getBytes(StandardCharsets.UTF_8);
        var service = new ProvisionInitialCompanyAdminService(new JdbcInitialCompanyAdminStore(jdbc), companies, new JdbcPasswordRecoveryAdapter(jdbc),
                new JdbcIdentityNotificationAdapter(jdbc, secret), new BCryptPasswordHashingAdapter(), audit, Clock.systemUTC(), secret);
        var transaction = new TransactionTemplate(new DataSourceTransactionManager(jdbc.getDataSource()));
        return (command, actor) -> {
            try {
                return java.util.Objects.requireNonNull(transaction.execute(status -> service.execute(command, actor)));
            } catch (ProvisionInitialCompanyAdminService.Conflict conflict) {
                audit.record(new RecordPlatformCompanyAuditCommand(command.companyId(),
                        AuditAction.PROVISION_INITIAL_COMPANY_ADMIN, AuditResult.CONFLICT));
                throw conflict;
            } catch (ProvisionInitialCompanyAdminService.CompanyUnavailable unavailable) {
                audit.record(new RecordPlatformCompanyAuditCommand(command.companyId(),
                        AuditAction.PROVISION_INITIAL_COMPANY_ADMIN, AuditResult.DENIED));
                throw unavailable;
            } catch (ProvisionInitialCompanyAdminService.Forbidden forbidden) {
                if (actor != null && actor.role() == BaseRole.PLATFORM_SUPERADMIN && actor.tenantId() != null) {
                    denialAudit.record(new RecordCompanyDenialAuditCommand(UUID.randomUUID(), command.companyId(),
                            AuditAction.PROVISION_INITIAL_COMPANY_ADMIN));
                }
                throw forbidden;
            }
        };
    }

    @Bean
    PasswordRecoveryRequestWorker passwordRecoveryRequestWorker(JdbcTemplate jdbc, AuthenticationProperties.Values p, PasswordRecoveryService recovery) {
        return new PasswordRecoveryRequestWorker(new JdbcPasswordRecoveryRequestAdapter(jdbc, p.getHmacSecret().getBytes(StandardCharsets.UTF_8)), recovery, Clock.systemUTC());
    }

    @Bean
    PasswordRecoveryRequestScheduler passwordRecoveryRequestScheduler(PasswordRecoveryRequestWorker worker) {
        return new PasswordRecoveryRequestScheduler(worker);
    }

    @Bean
    @ConditionalOnBean(TransactionalEmailGateway.class)
    IdentityNotificationDeliveryWorker identityNotificationDeliveryWorker(JdbcTemplate jdbc, AuthenticationProperties.Values p, TransactionalEmailGateway gateway) {
        return new IdentityNotificationDeliveryWorker(new JdbcIdentityNotificationAdapter(jdbc, p.getHmacSecret().getBytes(StandardCharsets.UTF_8)), gateway,
                Clock.systemUTC(), new Random(), Duration.ofSeconds(1), Duration.ofMinutes(5));
    }

    @Bean
    @ConditionalOnBean(IdentityNotificationDeliveryWorker.class)
    IdentityNotificationDeliveryScheduler identityNotificationDeliveryScheduler(IdentityNotificationDeliveryWorker worker) {
        return new IdentityNotificationDeliveryScheduler(worker);
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
    PasswordRecoveryRequestSizeFilter passwordRecoveryRequestSizeFilter() {
        return new PasswordRecoveryRequestSizeFilter();
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
                    try {
                        return service.refresh(command);
                    } catch (RefreshService.Rejected rejected) {
                        return rejected;
                    }
                }));
                if (outcome instanceof RefreshService.Rejected rejected) throw rejected;
                return (RefreshService.Result) outcome;
            };
        } catch (IllegalArgumentException | GeneralSecurityException e) {
            throw new IllegalStateException("Invalid RS256 authentication key", e);
        }
    }

    @Bean
    LogoutSessionUseCase logoutSessionUseCase(JdbcTemplate j, RecordAuthenticationAuditUseCase audit, StringRedisTemplate redis, RevokeInstallationsForSession installations, AuthenticationProperties.Values p) {
        var secret = p.getHmacSecret().getBytes(StandardCharsets.UTF_8);
        var service = new LogoutSessionService(new JdbcRefreshSessionAdapter(j), audit, new RedisLogoutAbuseMonitor(redis, secret), installations, Clock.systemUTC(), secret);
        var transaction = new TransactionTemplate(new DataSourceTransactionManager(j.getDataSource()));
        return command -> {
            Object outcome = transaction.execute(status -> {
                try {
                    service.logout(command);
                    return null;
                } catch (LogoutSessionService.AuditUnavailableAfterRevocation failure) {
                    return failure;
                }
            });
            if (outcome instanceof LogoutSessionService.AuditUnavailableAfterRevocation failure) throw failure;
        };
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
