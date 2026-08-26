package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ListSuggestedCustomersUseCase {
    Page list(Query query, AuthenticatedActor actor);

    record Query(UUID sellerId, LocalDate date, int page, int pageSize) { }
    record Page(List<Item> items, long total) { }
    record Item(Customer customer, int priority, String reason, Instant lastVisitAt) { }
    final class Forbidden extends RuntimeException { }
    final class Invalid extends RuntimeException { }
}
