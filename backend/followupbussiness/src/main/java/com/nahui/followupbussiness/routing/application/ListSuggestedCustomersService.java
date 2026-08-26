package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.routing.application.port.in.ListSuggestedCustomersUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.SellerReferenceUseCase;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

/** Read-only frequency suggestion policy. Lima is encapsulated until companies provide an IANA zone. */
public final class ListSuggestedCustomersService implements ListSuggestedCustomersUseCase {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Lima");
    private final CustomerPortfolioReadUseCase customers;
    private final SellerReferenceUseCase sellers;
    private final PortfolioAccessScopeUseCase scopes;

    public ListSuggestedCustomersService(CustomerPortfolioReadUseCase customers, SellerReferenceUseCase sellers, PortfolioAccessScopeUseCase scopes) {
        this.customers = customers; this.sellers = sellers; this.scopes = scopes;
    }

    @Override public Page list(Query query, AuthenticatedActor actor) {
        int offset = validate(query, actor);
        authorize(query, actor);
        var territories = sellers.activeTerritoriesAssignedTo(actor.tenantId(), query.sellerId());
        List<Item> all = customers.suggestedForSeller(actor.tenantId(), query.sellerId()).stream()
                .filter(candidate -> candidate.customer().territoryId() != null && territories.contains(candidate.customer().territoryId()))
                .map(candidate -> item(candidate, query.date())).flatMap(java.util.Optional::stream)
                .sorted(Comparator.comparingInt(Item::priority).reversed()
                        .thenComparing(item -> dueDate(item, query.date()))
                        .thenComparing(item -> item.customer().id()))
                .toList();
        int from = Math.min(offset, all.size());
        int to = Math.min(from + query.pageSize(), all.size());
        return new Page(all.subList(from, to), all.size());
    }

    private void authorize(Query query, AuthenticatedActor actor) {
        if (!sellers.allActive(actor.tenantId(), java.util.Set.of(query.sellerId()))) throw new Forbidden();
        try {
            var scope = scopes.resolve(actor);
            if (!scope.allCurrentPortfolios() && !scope.sellerIds().contains(query.sellerId())) throw new Forbidden();
        } catch (PortfolioAccessScopeUseCase.Forbidden e) { throw new Forbidden(); }
    }

    private static java.util.Optional<Item> item(CustomerPortfolioReadUseCase.SuggestionCandidate candidate, LocalDate date) {
        var customer = candidate.customer();
        Integer frequency = customer.visitFrequencyDays();
        if (frequency == null || frequency < 1 || frequency > 365) return java.util.Optional.empty();
        LocalDate due;
        String reason;
        if (candidate.lastCompletedVisitAt() == null) {
            due = customer.createdAt().atZone(BUSINESS_ZONE).toLocalDate();
            reason = "SIN_VISITA_PREVIA";
        } else {
            due = candidate.lastCompletedVisitAt().atZone(BUSINESS_ZONE).toLocalDate().plusDays(frequency);
            reason = "FRECUENCIA_VENCIDA";
        }
        if (date.isBefore(due)) return java.util.Optional.empty();
        long overdue = java.time.temporal.ChronoUnit.DAYS.between(due, date);
        return java.util.Optional.of(new Item(customer, Math.toIntExact(1 + overdue), reason, candidate.lastCompletedVisitAt()));
    }

    private static LocalDate dueDate(Item item, LocalDate requestedDate) {
        return item.lastVisitAt() == null ? item.customer().createdAt().atZone(BUSINESS_ZONE).toLocalDate()
                : item.lastVisitAt().atZone(BUSINESS_ZONE).toLocalDate().plusDays(item.customer().visitFrequencyDays());
    }
    private static int validate(Query q, AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || actor.accountId() == null || (actor.role() != BaseRole.COMPANY_ADMIN && actor.role() != BaseRole.SUPERVISOR)) throw new Forbidden();
        if (q == null || q.sellerId() == null || q.date() == null || q.page() < 0 || q.pageSize() < 1 || q.pageSize() > 200) throw new Invalid();
        long offset = (long) q.page() * q.pageSize();
        if (offset > Integer.MAX_VALUE) throw new Invalid();
        return (int) offset;
    }
}
