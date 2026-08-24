package com.nahui.followupbussiness.imports.application;

import com.nahui.followupbussiness.imports.application.port.in.*;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import com.nahui.followupbussiness.outbox.domain.OutboxEvent;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

public final class CustomerImportService implements CreateCustomerImportUseCase, GetCustomerImportUseCase {
    private static final int MAX_BYTES = 10 * 1024 * 1024;
    private final CustomerImportStore store; private final OutboxStore outbox; private final Clock clock;
    public CustomerImportService(CustomerImportStore store, OutboxStore outbox, Clock clock) { this.store = store; this.outbox = outbox; this.clock = clock; }
    @Override @Transactional public CustomerImport create(Command c, AuthenticatedActor actor, UUID correlation) {
        authorize(actor); validate(c); String hash = sha256(c.contents());
        var previous = store.findByIdempotency(actor.tenantId(), actor.accountId(), c.idempotencyKey());
        if (previous.isPresent()) { if (previous.get().fileSha256().equals(hash) && previous.get().templateVersion().equals(c.templateVersion()) && previous.get().partialAcceptance() == c.partialAcceptance()) return previous.get(); throw new Conflict(); }
        Instant now = clock.instant(); UUID id = UUID.randomUUID();
        var job = new CustomerImport(id, actor.tenantId(), actor.accountId(), correlation, c.idempotencyKey(), safeName(c.fileName()), c.contentType(), c.templateVersion(), c.partialAcceptance(), hash, CustomerImport.Status.PENDING, 0, 0, now, now, null, null);
        var saved = store.insertIfAbsent(job, c.contents());
        if (saved.isEmpty()) {
            CustomerImport existing = store.findByIdempotency(actor.tenantId(), actor.accountId(), c.idempotencyKey())
                    .orElseThrow(Conflict::new);
            if (sameRequest(existing, hash, c)) return existing;
            throw new Conflict();
        }
        outbox.append(new OutboxEvent(UUID.randomUUID(), "customer-import.requested.v1", 1, now, actor.tenantId(), correlation, id, "{\"importId\":\"" + id + "\",\"tenantId\":\"" + actor.tenantId() + "\",\"correlationId\":\"" + correlation + "\"}"));
        return saved.get();
    }
    @Override public java.util.Optional<CustomerImport> get(UUID id, AuthenticatedActor actor) { authorize(actor); return store.findById(actor.tenantId(), id); }
    private static void authorize(AuthenticatedActor a) { if (a == null || a.tenantId() == null || a.accountId() == null || a.role() != BaseRole.COMPANY_ADMIN) throw new CreateCustomerImportUseCase.Forbidden(); }
    private static boolean sameRequest(CustomerImport existing, String hash, Command command) { return existing.fileSha256().equals(hash) && existing.templateVersion().equals(command.templateVersion()) && existing.partialAcceptance() == command.partialAcceptance(); }
    private static void validate(Command c) { if (c == null || c.idempotencyKey() == null || !c.idempotencyKey().matches("[A-Za-z0-9._:-]{1,128}")) throw new Invalid("idempotency"); if (c.contents() == null || c.contents().length == 0) throw new Invalid("file"); if (c.contents().length > MAX_BYTES) throw new PayloadTooLarge(); if (!"1.0".equals(c.templateVersion())) throw new Invalid("version"); if (!("text/csv".equalsIgnoreCase(base(c.contentType())) || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet".equalsIgnoreCase(base(c.contentType())))) throw new Invalid("content type"); }
    private static String base(String x) { return x == null ? "" : x.split(";", 2)[0].trim(); }
    private static String safeName(String x) { if (x == null || x.isBlank() || x.length() > 255) throw new Invalid("filename"); return x.replaceAll("[\\r\\n]", "_"); }
    private static String sha256(byte[] data) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data)); } catch (Exception e) { throw new IllegalStateException(e); } }
}
