package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.audit.application.RecordAuthenticationAuditCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuthenticationAuditUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.LogoutSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.out.RefreshSessionPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.LogoutAbuseMonitor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.notifications.application.port.in.RevokeInstallationsForSession;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;

/**
 * Revokes only server-derived session resources; PostgreSQL is the authority.
 */
public final class LogoutSessionService implements LogoutSessionUseCase {
    private final RefreshSessionPort sessions;
    private final RecordAuthenticationAuditUseCase audit;
    private final LogoutAbuseMonitor abuse;
    private final RevokeInstallationsForSession installations;
    private final Clock clock;
    private final byte[] key;

    public LogoutSessionService(RefreshSessionPort sessions, RecordAuthenticationAuditUseCase audit, Clock clock, byte[] key) {
        this(sessions, audit, (account, tenant) -> new LogoutAbuseMonitor.Decision(false, 0), (family, tenant) -> { }, clock, key);
    }

    public LogoutSessionService(RefreshSessionPort sessions, RecordAuthenticationAuditUseCase audit, LogoutAbuseMonitor abuse, Clock clock, byte[] key) { this(sessions,audit,abuse,(family,tenant)->{},clock,key); }
    public LogoutSessionService(RefreshSessionPort sessions, RecordAuthenticationAuditUseCase audit, LogoutAbuseMonitor abuse, RevokeInstallationsForSession installations, Clock clock, byte[] key) {
        this.sessions = sessions;
        this.audit = audit;
        this.abuse = abuse;
        this.installations = installations;
        this.clock = clock;
        this.key = key.clone();
    }

    @Override
    public void logout(Command c) {
        Instant now = clock.instant();
        RefreshSessionPort.Resolution family;
        if (c.actor() != null) {
            if (c.actor().sessionFamilyId() == null) throw new Rejected();
            family = sessions.resolveById(c.actor().sessionFamilyId(), c.actor().accountId(), c.actor().tenantId());
            if (family == null) throw new Rejected();
            if (!family.expiresAt().isAfter(now) || ("WEB".equals(family.channel()) && (c.csrfToken() == null || !MessageDigest.isEqual(family.csrfDigest(), digest(c.csrfToken()))))) {
                auditRejected(family, c, now, "WEB".equals(family.channel()) ? RecordAuthenticationAuditCommand.Reason.CSRF_INVALID : RecordAuthenticationAuditCommand.Reason.INVALID);
                throw new Rejected();
            }
            if (c.allSessions()) { var ids=sessions.activeFamilyIds(c.actor().accountId(),c.actor().tenantId()); sessions.revokeAll(c.actor().accountId(), c.actor().tenantId(), now); for(var id:ids) installations.revoke(id,c.actor().tenantId()); }
            else { sessions.revoke(c.actor().sessionFamilyId(), now); installations.revoke(c.actor().sessionFamilyId(),c.actor().tenantId()); }
        } else {
            if (c.allSessions() || (c.revocationTicket() == null) == (c.webRefreshCookie() == null))
                throw new Rejected();
            family = c.revocationTicket() != null ? sessions.consumeRevocationTicket(digest(c.revocationTicket()), now) : sessions.resolve(digest(c.webRefreshCookie()));
            if (family == null || !family.expiresAt().isAfter(now) || !(c.revocationTicket() != null ? "MOBILE".equals(family.channel()) : "WEB".equals(family.channel())))
                throw new Rejected();
            sessions.revoke(family.familyId(), now);
            installations.revoke(family.familyId(),family.companyId());
        }
        try {
            audit.record(new RecordAuthenticationAuditCommand(family.accountId(), family.familyId(), family.companyId(), c.correlationId(), RecordAuthenticationAuditCommand.Channel.valueOf(family.channel()), RecordAuthenticationAuditCommand.Result.LOGGED_OUT, now, c.allSessions() ? RecordAuthenticationAuditCommand.Reason.GLOBAL : null));
        } catch (RuntimeException failure) {
            if (isTenantlessPlatformLogout(c, family)) throw new AuditUnavailableAfterRevocation(failure);
            throw failure;
        }
        if (c.allSessions()) try { abuse.recordGlobal(family.accountId(), family.companyId()); } catch (RuntimeException ignored) { }
    }

    private boolean isTenantlessPlatformLogout(Command command, RefreshSessionPort.Resolution family) {
        return command.actor() != null
                && command.actor().role() == BaseRole.PLATFORM_SUPERADMIN
                && command.actor().tenantId() == null
                && family.companyId() == null;
    }

    private byte[] digest(String v) {
        try {
            var m = Mac.getInstance("HmacSHA256");
            m.init(new SecretKeySpec(key, "HmacSHA256"));
            return m.doFinal(v.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private void auditRejected(RefreshSessionPort.Resolution family, Command command, Instant now, RecordAuthenticationAuditCommand.Reason reason) {
        try { audit.record(new RecordAuthenticationAuditCommand(family.accountId(), family.familyId(), family.companyId(), command.correlationId(), RecordAuthenticationAuditCommand.Channel.valueOf(family.channel()), RecordAuthenticationAuditCommand.Result.REJECTED, now, reason)); } catch (RuntimeException ignored) { }
    }

    public static final class Rejected extends RuntimeException {
    }
    /** The transaction wrapper commits the already durable revocation, then exposes the failure. */
    public static final class AuditUnavailableAfterRevocation extends RuntimeException {
        public AuditUnavailableAfterRevocation(RuntimeException cause) { super(cause); }
    }
}
