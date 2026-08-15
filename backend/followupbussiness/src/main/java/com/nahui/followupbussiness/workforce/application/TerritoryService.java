package com.nahui.followupbussiness.workforce.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.*;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import com.nahui.followupbussiness.workforce.application.port.out.TerritoryStore;
import com.nahui.followupbussiness.workforce.domain.*;

import java.time.Clock;
import java.util.*;

import org.springframework.transaction.annotation.Transactional;

public class TerritoryService {
    private final TerritoryStore store;
    private final RecordAuditEntryUseCase audit;
    private final Clock clock;

    public TerritoryService(TerritoryStore store, RecordAuditEntryUseCase audit, Clock clock) {
        this.store = store;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public Territory create(String name, String code, String description, AuthenticatedActor actor) {
        UUID tenant = admin(actor);
        String n = clean(name), c = optional(code);
        if (store.existsName(tenant, n, null) || (c != null && store.existsCode(tenant, c, null)))
            throw new ConflictException();
        Territory saved = store.insert(new Territory(UUID.randomUUID(), tenant, n, c, optional(description), TerritoryStatus.ACTIVE, clock.instant(), clock.instant(), 1));
        audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.TERRITORY, saved.id(), AuditResult.SUCCESS, Map.of(), Map.of("status", "ACTIVE")));
        return saved;
    }

    public Optional<Territory> get(UUID id, AuthenticatedActor actor) {
        return store.find(viewer(actor), id);
    }

    public Page list(TerritoryStatus status, String search, int page, int size, AuthenticatedActor actor) {
        UUID tenant = viewer(actor);
        String s = optional(search);
        return new Page(store.list(tenant, status, s, page * size, size), store.count(tenant, status, s));
    }

    @Transactional
    public Territory update(UUID id, String name, String code, String description, TerritoryStatus status, long version, AuthenticatedActor actor) {
        UUID tenant = admin(actor);
        Territory before = store.find(tenant, id).orElseThrow(NotFoundException::new);
        if (version != before.version()) throw new ConflictException();
        String n = name == null ? before.name() : clean(name), c = code == null ? before.code() : optional(code), d = description == null ? before.description() : optional(description);
        TerritoryStatus st = status == null ? before.status() : status;
        if (before.name().equals(n) && Objects.equals(before.code(), c) && Objects.equals(before.description(), d) && before.status() == st)
            return before;
        if (store.existsName(tenant, n, id) || (c != null && store.existsCode(tenant, c, id)))
            throw new ConflictException();
        Territory after = new Territory(id, tenant, n, c, d, st, before.createdAt(), clock.instant(), before.version() + 1);
        Territory saved = store.update(after, version).orElseThrow(ConflictException::new);
        Map<String, String> b = before.status() == st ? Map.of() : Map.of("status", before.status().name());
        Map<String, String> a = before.status() == st ? Map.of() : Map.of("status", st.name());
        audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.TERRITORY, id, AuditResult.SUCCESS, b, a));
        return saved;
    }

    private static UUID viewer(AuthenticatedActor a) {
        if (a == null || a.tenantId() == null || (a.role() != BaseRole.COMPANY_ADMIN && a.role() != BaseRole.SUPERVISOR))
            throw new AccessDeniedException();
        return a.tenantId();
    }

    private static UUID admin(AuthenticatedActor a) {
        viewer(a);
        if (a.role() != BaseRole.COMPANY_ADMIN) throw new AccessDeniedException();
        return a.tenantId();
    }

    private static String clean(String v) {
        if (v == null || v.trim().length() < 2) throw new IllegalArgumentException("invalid name");
        return v.trim();
    }

    private static String optional(String v) {
        return v == null ? null : (v.trim().isEmpty() ? null : v.trim());
    }

    public record Page(List<Territory> items, long total) {
    }

    public static final class AccessDeniedException extends RuntimeException {
    }

    public static final class NotFoundException extends RuntimeException {
    }

    public static final class ConflictException extends RuntimeException {
    }
}
