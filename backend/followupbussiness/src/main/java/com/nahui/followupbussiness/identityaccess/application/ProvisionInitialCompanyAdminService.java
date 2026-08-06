package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAuditCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.identityaccess.application.port.in.ProvisionInitialCompanyAdminUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.out.IdentityNotificationPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.InitialCompanyAdminStore;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordHashingPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryPort;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class ProvisionInitialCompanyAdminService implements ProvisionInitialCompanyAdminUseCase {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final InitialCompanyAdminStore accounts; private final CompanyAccessStatusQuery companies;
    private final PasswordRecoveryPort recovery; private final IdentityNotificationPort notifications;
    private final PasswordHashingPort passwords; private final RecordPlatformCompanyAuditUseCase audit;
    private final Clock clock; private final byte[] hmacKey;
    public ProvisionInitialCompanyAdminService(InitialCompanyAdminStore accounts, CompanyAccessStatusQuery companies, PasswordRecoveryPort recovery,
            IdentityNotificationPort notifications, PasswordHashingPort passwords, RecordPlatformCompanyAuditUseCase audit, Clock clock, byte[] hmacKey) {
        this.accounts=accounts; this.companies=companies; this.recovery=recovery; this.notifications=notifications; this.passwords=passwords; this.audit=audit; this.clock=clock; this.hmacKey=hmacKey.clone();
    }
    @Override public ProvisionInitialCompanyAdminResult execute(ProvisionInitialCompanyAdminCommand command, AuthenticatedActor actor) {
        if (actor == null || actor.role() != BaseRole.PLATFORM_SUPERADMIN || actor.tenantId() != null) throw new Forbidden();
        if (command == null || command.companyId() == null || !companies.isActive(command.companyId())) throw new CompanyUnavailable();
        String email = canonical(command.email()); String username = canonical(command.username() == null || command.username().isBlank() ? email : command.username());
        String displayName = command.displayName() == null ? null : command.displayName().strip();
        if (displayName == null || displayName.length() < 2 || displayName.length() > 160 || email == null || username == null) throw new Invalid();
        UUID id=UUID.randomUUID(); char[] unusable=secret().toCharArray();
        try {
            if (!accounts.create(id, command.companyId(), username, passwords.hash(unusable), displayName, email)) throw new Conflict();
        } finally { java.util.Arrays.fill(unusable, '\0'); }
        String token=secret(); var expires=clock.instant().plus(Duration.ofHours(24));
        recovery.replaceToken(new PasswordRecoveryPort.Token(id, command.companyId(), PasswordRecoveryPort.Purpose.ACTIVATION, digest(token), expires));
        notifications.enqueue(id, command.companyId(), PasswordRecoveryPort.Purpose.ACTIVATION, email, token, expires);
        audit.record(new RecordPlatformCompanyAuditCommand(command.companyId(), AuditAction.PROVISION_INITIAL_COMPANY_ADMIN, AuditResult.SUCCESS));
        return accounts.created(id);
    }
    private static String canonical(String value) { if (value == null) return null; String x=value.strip().toLowerCase(Locale.ROOT); return x.isBlank() ? null : x; }
    private static String secret() { byte[] value=new byte[32]; RANDOM.nextBytes(value); return Base64.getUrlEncoder().withoutPadding().encodeToString(value); }
    private byte[] digest(String value) { try { var mac=Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(hmacKey,"HmacSHA256")); return mac.doFinal(value.getBytes(StandardCharsets.UTF_8)); } catch (Exception e) { throw new IllegalStateException("Unable to digest activation token",e); } }
    public static final class Forbidden extends RuntimeException { } public static final class CompanyUnavailable extends RuntimeException { }
    public static final class Conflict extends RuntimeException { } public static final class Invalid extends RuntimeException { }
}
