package com.nahui.followupbussiness.customers.application;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuditEntryUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResourceType;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioAssignmentUseCase;
import com.nahui.followupbussiness.customers.application.port.out.CustomerPortfolioStore;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;

import java.time.Clock;
import java.time.Instant;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Transactional owner of the durable current portfolio transition.
 */
public class CustomerPortfolioAssignmentService implements CustomerPortfolioAssignmentUseCase {
    private final CustomerStore customers;
    private final CustomerPortfolioStore portfolios;
    private final SellerReferenceUseCase sellers;
    private final RecordAuditEntryUseCase audit;
    private final Clock clock;

    public CustomerPortfolioAssignmentService(CustomerStore customers, CustomerPortfolioStore portfolios, SellerReferenceUseCase sellers, RecordAuditEntryUseCase audit, Clock clock) {
        this.customers = customers;
        this.portfolios = portfolios;
        this.sellers = sellers;
        this.audit = audit;
        this.clock = clock;
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Result assign(Command c, AuthenticatedActor actor) {
        valid(c.customerId(), c.sellerIds(), c.effectiveFrom(), actor);
        var customer = customers.find(actor.tenantId(), c.customerId()).orElseThrow(NotFound::new);
        if (!"ACTIVE".equals(customer.status())) throw new InvalidSeller();
        if (!sellers.allActive(actor.tenantId(), c.sellerIds())) throw new InvalidSeller();
        portfolios.lock(actor.tenantId(), c.customerId());
        if (portfolios.hasFutureAssignment(actor.tenantId(), c.customerId())) throw new Conflict();
        if (!samePortfolio(actor.tenantId(), c.customerId(), c.sellerIds())) {
            portfolios.replace(actor.tenantId(), c.customerId(), c.sellerIds(), actor.accountId(), c.effectiveFrom(), c.reason(), clock.instant());
            if (!audit.record(new RecordAuditEntryCommand(AuditAction.CRITICAL_MUTATION, AuditResourceType.CUSTOMER, c.customerId(), AuditResult.SUCCESS, Map.of(), Map.of())))
                throw new IllegalStateException("audit persistence failed");
            customer = touch(customer);
            if (!customers.update(customer, customer.version() - 1)) throw new Conflict();
        }
        return new Result(c.customerId(), Set.copyOf(c.sellerIds()), c.effectiveFrom(), customer.updatedAt(), customer.version());
    }

    @Override
    @Transactional
    public BatchResult assignBatch(BatchCommand c, AuthenticatedActor actor) {
        authorize(actor);
        if (c == null || c.idempotencyKey() == null || c.customerIds() == null || c.customerIds().isEmpty() || c.customerIds().size() > 1000 || new HashSet<>(c.customerIds()).size() != c.customerIds().size() || c.sellerIds() == null || c.sellerIds().isEmpty() || c.sellerIds().stream().anyMatch(Objects::isNull) || c.effectiveFrom() == null)
            throw new Invalid();
        String fingerprint = fingerprint(c);
        var reservation = portfolios.reserveIdempotency(actor.tenantId(), c.idempotencyKey(), fingerprint, clock.instant());
        if (!reservation.owner()) {
            if (!reservation.record().fingerprint().equals(fingerprint)) throw new Conflict();
            return new BatchResult(reservation.record().results().stream().map(CustomerPortfolioAssignmentService::item).toList());
        }
        List<Item> items = new ArrayList<>();
        for (UUID id : c.customerIds()) {
            try {
                assign(new Command(id, c.sellerIds(), c.effectiveFrom(), c.reason()), actor);
                items.add(new Item(id, "ASSIGNED", null));
            } catch (NotFound e) {
                items.add(new Item(id, "REJECTED", "NOT_FOUND"));
            } catch (InvalidSeller e) {
                items.add(new Item(id, "REJECTED", "UNPROCESSABLE"));
            } catch (Conflict e) {
                items.add(new Item(id, "REJECTED", "CONFLICT"));
            } catch (Invalid e) {
                items.add(new Item(id, "REJECTED", "UNPROCESSABLE"));
            }
        }
        portfolios.completeIdempotency(actor.tenantId(), c.idempotencyKey(), items.stream().map(CustomerPortfolioAssignmentService::encode).toList());
        return new BatchResult(List.copyOf(items));
    }

    private boolean samePortfolio(UUID tenantId, UUID customerId, Set<UUID> sellerIds) {
        return portfolios.current(tenantId, customerId).stream().map(CustomerPortfolioStore.Assignment::sellerId).collect(java.util.stream.Collectors.toSet()).equals(sellerIds);
    }

    private void valid(UUID id, Set<UUID> sellers, java.time.LocalDate date, AuthenticatedActor actor) {
        authorize(actor);
        if (id == null || sellers == null || sellers.isEmpty() || sellers.stream().anyMatch(Objects::isNull) || date == null)
            throw new Invalid();
    }

    private static void authorize(AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || actor.role() != BaseRole.COMPANY_ADMIN) throw new Forbidden();
    }

    private static String fingerprint(BatchCommand c) {
        try {
            String canonical = String.join("|", c.customerIds().stream().map(UUID::toString).toList()) + ";" + String.join(",", c.sellerIds().stream().map(UUID::toString).sorted().toList()) + ";" + c.effectiveFrom() + ";" + (c.reason() == null ? "" : c.reason());
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String encode(Item item) {
        return item.customerId() + "|" + item.status() + "|" + (item.errorCode() == null ? "" : item.errorCode());
    }

    private static Item item(String value) {
        String[] fields = value.split("\\|", -1);
        return new Item(UUID.fromString(fields[0]), fields[1], fields[2].isEmpty() ? null : fields[2]);
    }

    private Customer touch(Customer value) {
        Instant now = clock.instant();
        return new Customer(value.id(), value.tenantId(), value.name(), value.documentType(), value.documentNumber(),
                value.phone(), value.email(), value.segment(), value.address(), value.location(), value.visitFrequencyDays(),
                value.territoryId(), value.status(), value.createdAt(), now, value.version() + 1);
    }
}
