package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditEntry;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.audit.domain.AuditScope;
import com.nahui.followupbussiness.identityaccess.application.port.out.IdentityNotificationPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryPort;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;

/** Company-user policy; its caller supplies one transaction for every durable mutation. */
public class CompanyUserService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final UUID UNSPECIFIED_CORRELATION = new UUID(0L, 0L);
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final PasswordRecoveryPort recovery;
    private final IdentityNotificationPort notifications;
    private final AuditEntryStore audit;
    private final OutboxStore outbox;
    private final byte[] hmac;

    public CompanyUserService(JdbcTemplate jdbc, Clock clock) { this(jdbc, clock, null, null, null, null, null); }

    public CompanyUserService(JdbcTemplate jdbc, Clock clock, PasswordRecoveryPort recovery, IdentityNotificationPort notifications,
                              AuditEntryStore audit, OutboxStore outbox, byte[] hmac) {
        this.jdbc = jdbc; this.clock = clock; this.recovery = recovery; this.notifications = notifications;
        this.audit = audit; this.outbox = outbox; this.hmac = hmac == null ? null : hmac.clone();
    }

    public UserPage list(int page, int pageSize, String search, BaseRole role, String status, AuthenticatedActor actor) {
        UUID tenant = tenant(actor);
        if (page < 0 || pageSize < 1 || pageSize > 200 || (search != null && (search.isBlank() || search.length() > 120))) throw new Invalid();
        if (role != null) validRole(role);
        if (status != null && !Set.of("INVITED", "ACTIVE", "INACTIVE", "LOCKED").contains(status)) throw new Invalid();
        List<Object> args = new ArrayList<>(); args.add(tenant);
        StringBuilder where = new StringBuilder(" WHERE company_id=?");
        if (search != null) { where.append(" AND (display_name ILIKE ? OR login_identifier ILIKE ? OR email ILIKE ?)"); String like = "%" + search.strip() + "%"; args.add(like); args.add(like); args.add(like); }
        if (role != null) { where.append(" AND role_code=?"); args.add(role.code()); }
        if (status != null) { where.append(" AND status=?"); args.add(status); }
        long total = jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_account" + where, Long.class, args.toArray());
        args.add(pageSize); args.add((long) page * pageSize);
        List<User> items = jdbc.query("SELECT id,display_name,login_identifier,email,role_code,status,created_at,updated_at,credential_version FROM identity_access_account" + where + " ORDER BY created_at,id LIMIT ? OFFSET ?", (r,n) -> user(r), args.toArray());
        return new UserPage(items, new PageInfo(page, pageSize, total, (int) Math.ceil((double) total / pageSize)));
    }

    public User get(UUID id, AuthenticatedActor actor) {
        UUID tenant = tenant(actor);
        return find(id, tenant);
    }
    public User get(UUID id, AuthenticatedActor actor, UUID correlationId) { return get(id, actor); }

    public User invite(Invite command, AuthenticatedActor actor) {
        return invite(command, actor, UNSPECIFIED_CORRELATION);
    }
    public User invite(Invite command, AuthenticatedActor actor, UUID correlationId) {
        UUID tenant = admin(actor);
        validInvite(command);
        validRole(command.role());
        String login = canonical(command.username() == null ? command.email() : command.username());
        String email = canonical(command.email());
        try {
            UUID id = UUID.randomUUID(); Instant now = clock.instant();
            jdbc.update("INSERT INTO identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) VALUES(?,?,? ,?,?,'INVITED',?,?,?,?)",
                    id, login, "$2a$12$.....................................................", command.role().code(), tenant,
                    validName(command.name()), email, Timestamp.from(now), Timestamp.from(now));
            if (recovery != null) {
                String token = secret(); Instant expires = now.plus(Duration.ofHours(24));
                recovery.replaceToken(new PasswordRecoveryPort.Token(id, tenant, PasswordRecoveryPort.Purpose.ACTIVATION, digest(token), expires));
                notifications.enqueue(id, tenant, PasswordRecoveryPort.Purpose.ACTIVATION, email, token, expires);
            }
            User created = find(id, tenant);
            durableSuccess(actor, created, null, now, correlationId);
            return created;
        } catch (DuplicateKeyException e) { throw new Conflict(); }
    }

    public User update(UUID id, Update command, AuthenticatedActor actor) {
        return update(id, command, actor, UNSPECIFIED_CORRELATION);
    }
    public User update(UUID id, Update command, AuthenticatedActor actor, UUID correlationId) {
        validUpdate(command);
        UUID tenant = admin(actor); User old = find(id, tenant);
        if (!"ACTIVE".equals(old.status()) || command.version() != old.version()) throw new Conflict();
        String name = command.name() == null ? old.name() : validName(command.name());
        String email = command.email() == null ? old.email() : validEmail(command.email());
        String username = command.username() == null ? old.username() : validUsername(command.username());
        BaseRole role = command.role() == null ? old.role() : command.role(); validRole(role);
        if (old.role() == BaseRole.COMPANY_ADMIN && role != BaseRole.COMPANY_ADMIN) guardLastAdmin(tenant, id);
        try {
            int changed = jdbc.update("UPDATE identity_access_account SET display_name=?,email=?,login_identifier=?,role_code=?,credential_version=credential_version+1,updated_at=? WHERE id=? AND company_id=? AND credential_version=?",
                    name, email, username, role.code(),
                    Timestamp.from(clock.instant()), id, tenant, command.version());
            if (changed != 1) throw new Conflict();
            User updated = find(id, tenant); durableSuccess(actor, updated, old.status(), updated.updatedAt(), correlationId); return updated;
        } catch (DuplicateKeyException e) { throw new Conflict(); }
    }

    public User status(UUID id, String target, AuthenticatedActor actor) {
        return status(id, target, actor, UNSPECIFIED_CORRELATION);
    }
    public User status(UUID id, String target, AuthenticatedActor actor, UUID correlationId) {
        UUID tenant = admin(actor); User before = find(id, tenant);
        if (before.status().equals(target)) return before;
        boolean valid = ("LOCKED".equals(target) && Set.of("INVITED", "ACTIVE", "INACTIVE").contains(before.status()))
                || ("INACTIVE".equals(target) && "ACTIVE".equals(before.status()))
                || ("ACTIVE".equals(target) && Set.of("LOCKED", "INACTIVE").contains(before.status()));
        if (!valid) throw new Conflict();
        if (("LOCKED".equals(target) || "INACTIVE".equals(target)) && before.role() == BaseRole.COMPANY_ADMIN) guardLastAdmin(tenant, id);
        Instant now = clock.instant();
        int changed = jdbc.update("UPDATE identity_access_account SET status=?,credential_version=credential_version+1,updated_at=? WHERE id=? AND company_id=? AND status=?",
                target, Timestamp.from(now), id, tenant, before.status());
        if (changed != 1) throw new Conflict();
        if (!"ACTIVE".equals(target)) {
            jdbc.update("UPDATE identity_access_session_family SET revoked_at=COALESCE(revoked_at,?) WHERE account_id=? AND company_id=?", Timestamp.from(now), id, tenant);
            jdbc.update("UPDATE identity_access_action_token SET invalidated_at=COALESCE(invalidated_at,?) WHERE account_id=?", Timestamp.from(now), id);
        }
        User after = find(id, tenant); durableSuccess(actor, after, before.status(), now, correlationId); return after;
    }

    private User find(UUID id, UUID tenant) {
        return jdbc.query("SELECT id,display_name,login_identifier,email,role_code,status,created_at,updated_at,credential_version FROM identity_access_account WHERE id=? AND company_id=?", (r,n) -> user(r), id, tenant).stream().findFirst().orElseThrow(NotFound::new);
    }

    /** Locks every current admin row, giving all reductions in one company a common serialization point. */
    private void guardLastAdmin(UUID tenant, UUID id) {
        List<UUID> admins = jdbc.query("SELECT id FROM identity_access_account WHERE company_id=? AND role_code='COMPANY_ADMIN' AND status='ACTIVE' FOR UPDATE", (r,n) -> r.getObject(1, UUID.class), tenant);
        if (admins.stream().noneMatch(other -> !other.equals(id))) throw new Conflict();
    }

    private void durableSuccess(AuthenticatedActor actor, User user, String beforeStatus, Instant now, UUID correlationId) {
        if (audit != null) {
            Map<String, String> before = beforeStatus == null ? Map.of() : Map.of("status", beforeStatus);
            Map<String, String> after = Map.of("status", user.status());
            boolean appended = audit.append(new AuditEntry(UUID.randomUUID(), actor.tenantId(), actor.accountId(), AuditAction.CRITICAL_MUTATION,
                    "COMPANY_USER", user.id(), AuditResult.SUCCESS, correlationId, AuditScope.AUTHORIZED_RESOURCE.name(), before, after, now));
            if (!appended) throw new IllegalStateException("Company-user audit was not persisted");
        }
        if (outbox != null) {
            String payload = "{\"userId\":\"" + user.id() + "\",\"status\":\"" + user.status() + "\",\"role\":\"" + user.role().name() + "\"}";
            outbox.append(new OutboxEvent(UUID.randomUUID(), "identity.company-user.changed", 1, now, actor.tenantId(), correlationId, user.id(), payload));
        }
    }

    private UUID tenant(AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || !(actor.role() == BaseRole.COMPANY_ADMIN || actor.role() == BaseRole.SUPERVISOR)) throw new Forbidden();
        return actor.tenantId();
    }
    private UUID admin(AuthenticatedActor actor) { UUID tenant = tenant(actor); if (actor.role() != BaseRole.COMPANY_ADMIN) throw new Forbidden(); return tenant; }
    private static void validRole(BaseRole role) { if (role != BaseRole.COMPANY_ADMIN && role != BaseRole.SUPERVISOR) throw new Invalid(); }
    private static void validInvite(Invite command) { if (command == null) throw new Invalid(); validName(command.name()); validEmail(command.email()); if (command.username()!=null) validUsername(command.username()); }
    private static void validUpdate(Update command) { if (command == null) throw new Invalid(); if (command.name() != null) validName(command.name()); if (command.email() != null) validEmail(command.email()); if (command.username() != null) validUsername(command.username()); if (command.role() != null) validRole(command.role()); }
    private static String canonical(String value) { rejectCrLf(value); if ((value = value.strip().toLowerCase(Locale.ROOT)).isBlank()) throw new Invalid(); return value; }
    private static String validName(String value) { rejectCrLf(value); if(value==null || (value=value.strip()).length()<2 || value.length()>160) throw new Invalid(); return value; }
    private static String validUsername(String value) { rejectCrLf(value); if(value==null || (value=value.strip().toLowerCase(Locale.ROOT)).length()<3 || value.length()>100) throw new Invalid(); return value; }
    private static String validEmail(String value) { String email=canonical(value); if(email.length()>254 || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) throw new Invalid(); return email; }
    private static void rejectCrLf(String value) { if (value == null || value.indexOf('\r') >= 0 || value.indexOf('\n') >= 0) throw new Invalid(); }
    private String secret() { byte[] bytes = new byte[32]; RANDOM.nextBytes(bytes); return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
    private byte[] digest(String token) { try { Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(hmac, "HmacSHA256")); return mac.doFinal(token.getBytes(StandardCharsets.UTF_8)); } catch (Exception e) { throw new IllegalStateException(e); } }
    private static User user(java.sql.ResultSet r) throws java.sql.SQLException { return new User(r.getObject(1, UUID.class), r.getString(2), r.getString(3), r.getString(4), BaseRole.valueOf(r.getString(5)), r.getString(6), r.getTimestamp(7).toInstant(), r.getTimestamp(8).toInstant(), r.getLong(9)); }
    public record Invite(String name, String username, String email, BaseRole role) { }
    public record Update(String name, String username, String email, BaseRole role, long version) { }
    public record User(UUID id, @JsonProperty("displayName") String name, String username, String email, BaseRole role, String status, Instant createdAt, Instant updatedAt, long version) { }
    public record UserPage(List<User> items, PageInfo page) { }
    public record PageInfo(int page, int pageSize, long totalElements, int totalPages) { }
    public static final class Forbidden extends RuntimeException { }
    public static final class NotFound extends RuntimeException { }
    public static final class Conflict extends RuntimeException { }
    public static final class Invalid extends RuntimeException { }
}
