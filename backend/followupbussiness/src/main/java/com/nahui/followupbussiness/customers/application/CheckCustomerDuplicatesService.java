package com.nahui.followupbussiness.customers.application;

import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Read-only, tenant-scoped duplicate candidate lookup.
 */
public final class CheckCustomerDuplicatesService {
    private final CustomerStore store;

    public CheckCustomerDuplicatesService(CustomerStore store) {
        this.store = store;
    }

    public Result check(Command command, AuthenticatedActor actor) {
        UUID tenant = tenant(actor);
        if (command == null) throw new Invalid();
        String name = required(command.name());
        CustomerStore.DuplicateCriteria criteria = new CustomerStore.DuplicateCriteria(
                name, identity(command.documentNumber()), identity(command.phone()), optional(command.address()),
                command.location() == null ? null : command.location().latitude(), command.location() == null ? null : command.location().longitude(), command.excludeCustomerId());
        List<CustomerStore.DuplicateMatch> matches = store.findDuplicateMatches(tenant, criteria);
        return new Result(matches.stream().map(match -> new Candidate(match.customer(), match.matchedFields(), match.matchedFields().size() / 5.0d)).toList());
    }

    private static UUID tenant(AuthenticatedActor actor) {
        if (actor == null || actor.tenantId() == null || actor.role() != BaseRole.COMPANY_ADMIN) throw new Forbidden();
        return actor.tenantId();
    }

    private static String required(String value) {
        String result = optional(value);
        if (result == null) throw new Invalid();
        return result;
    }

    private static String optional(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private static String identity(String value) {
        String result = optional(value);
        return result == null ? null : result.replace(" ", "").replace("-", "");
    }

    public record Command(String name, String documentNumber, String phone, String address, GeoPoint location,
                          UUID excludeCustomerId) {
    }

    public record Candidate(com.nahui.followupbussiness.customers.domain.Customer customer,
                            java.util.Set<CustomerStore.MatchedField> matchedFields, double score) {
    }

    public record Result(List<Candidate> candidates) {
        public boolean hasPossibleDuplicates() {
            return !candidates.isEmpty();
        }
    }

    public static final class Forbidden extends RuntimeException {
    }

    public static final class Invalid extends RuntimeException {
    }
}
