package com.nahui.followupbussiness.customers.application.port.out;

import com.nahui.followupbussiness.customers.domain.Customer;

import java.util.UUID;
import java.util.Optional;
import java.util.List;
import java.util.Set;

public interface CustomerStore {
    Customer insert(Customer customer);

    Optional<Customer> find(UUID tenantId, UUID customerId);

    boolean update(Customer customer, long expectedVersion);

    List<DuplicateMatch> findDuplicateMatches(UUID tenantId, DuplicateCriteria criteria);

    record DuplicateCriteria(String name, String documentNumber, String phone, String address,
                             Double latitude, Double longitude, UUID excludeCustomerId) {
    }

    record DuplicateMatch(Customer customer, Set<MatchedField> matchedFields) {
    }

    enum MatchedField {DOCUMENT, PHONE, NAME, ADDRESS, LOCATION}
}
