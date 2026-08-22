package com.nahui.followupbussiness.customers.adapter.in.rest;

import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioAssignmentUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.util.*;

import org.springframework.http.*;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public final class CustomerPortfolioAssignmentController {
    private final CustomerPortfolioAssignmentUseCase useCase;

    public CustomerPortfolioAssignmentController(CustomerPortfolioAssignmentUseCase useCase) {
        this.useCase = useCase;
    }

    @PutMapping("/customers/{customerId}/assignment")
    public ResponseEntity<?> assign(@PathVariable UUID customerId, @RequestBody Request r, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID c = CustomerController.correlationId(http);
        try {
            var x = useCase.assign(new CustomerPortfolioAssignmentUseCase.Command(customerId, r.sellerIds(), r.effectiveFrom(), r.reason()), actor);
            return ResponseEntity.ok().header("X-Correlation-Id", c.toString()).body(new AssignmentResponse(x.customerId(), x.sellerIds(), x.effectiveFrom(), x.updatedAt(), x.version()));
        } catch (CustomerPortfolioAssignmentUseCase.Forbidden e) {
            return CustomerController.problem(HttpStatus.FORBIDDEN, c);
        } catch (CustomerPortfolioAssignmentUseCase.NotFound e) {
            return CustomerController.problem(HttpStatus.NOT_FOUND, c);
        } catch (CustomerPortfolioAssignmentUseCase.Conflict e) {
            return CustomerController.problem(HttpStatus.CONFLICT, c);
        } catch (ConcurrencyFailureException e) {
            return CustomerController.problem(HttpStatus.CONFLICT, c);
        } catch (RuntimeException e) {
            return CustomerController.problem(HttpStatus.UNPROCESSABLE_CONTENT, c);
        }
    }

    @PostMapping("/customer-assignments/batch")
    public ResponseEntity<?> batch(@RequestHeader("Idempotency-Key") UUID key, @RequestBody Batch r, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID c = CustomerController.correlationId(http);
        try {
            var x = useCase.assignBatch(new CustomerPortfolioAssignmentUseCase.BatchCommand(r.customerIds(), r.sellerIds(), r.effectiveFrom(), r.reason(), key), actor);
            return ResponseEntity.ok().header("X-Correlation-Id", c.toString()).body(new BatchResponse(x.results().stream().map(item -> new BatchItemResponse(item.customerId(), item.status(), item.errorCode())).toList()));
        } catch (CustomerPortfolioAssignmentUseCase.Forbidden e) {
            return CustomerController.problem(HttpStatus.FORBIDDEN, c);
        } catch (CustomerPortfolioAssignmentUseCase.Conflict e) {
            return CustomerController.problem(HttpStatus.CONFLICT, c);
        } catch (ConcurrencyFailureException e) {
            return CustomerController.problem(HttpStatus.CONFLICT, c);
        } catch (RuntimeException e) {
            return CustomerController.problem(HttpStatus.UNPROCESSABLE_CONTENT, c);
        }
    }

    public record Request(Set<UUID> sellerIds, LocalDate effectiveFrom, String reason) {
    }

    public record Batch(List<UUID> customerIds, Set<UUID> sellerIds, LocalDate effectiveFrom, String reason) {
    }

    record AssignmentResponse(UUID customerId, Set<UUID> sellerIds, LocalDate effectiveFrom, java.time.Instant updatedAt,
                              long version) { }
    record BatchResponse(List<BatchItemResponse> results) { }
    record BatchItemResponse(UUID customerId, String status, String errorCode) { }
}
