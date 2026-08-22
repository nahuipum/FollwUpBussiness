package com.nahui.followupbussiness.customers.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface CustomerPortfolioAssignmentUseCase {
    Result assign(Command command, AuthenticatedActor actor);

    BatchResult assignBatch(BatchCommand command, AuthenticatedActor actor);

    record Command(UUID customerId, Set<UUID> sellerIds, LocalDate effectiveFrom, String reason) {
    }

    record BatchCommand(List<UUID> customerIds, Set<UUID> sellerIds, LocalDate effectiveFrom, String reason,
                        UUID idempotencyKey) {
    }

    record Result(UUID customerId, Set<UUID> sellerIds, LocalDate effectiveFrom, java.time.Instant updatedAt,
                  long version) {
    }

    record BatchResult(List<Item> results) {
    }

    record Item(UUID customerId, String status, String errorCode) {
    }

    final class Forbidden extends RuntimeException {
    }

    final class NotFound extends RuntimeException {
    }

    final class InvalidSeller extends RuntimeException {
    }

    final class Conflict extends RuntimeException {
    }

    final class Invalid extends RuntimeException {
    }
}
