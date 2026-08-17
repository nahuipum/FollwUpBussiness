package com.nahui.followupbussiness.workforce.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.nahui.followupbussiness.workforce.application.SellerService;
import com.nahui.followupbussiness.workforce.domain.Seller;
import com.nahui.followupbussiness.workforce.domain.TerritoryStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.*;

import org.springframework.http.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sellers")
public final class SellerController {
    private final SellerService service;

    public SellerController(SellerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http,
                                  @RequestParam(defaultValue = "0") @Min(0) int page,
                                  @RequestParam(name = "pageSize", defaultValue = "20") @Min(1) @Max(200) int pageSize,
                                  @RequestParam(required = false) TerritoryStatus status,
                                  @RequestParam(required = false) UUID supervisorId,
                                  @RequestParam(required = false) UUID territoryId,
                                  @RequestParam(required = false) @Size(max = 160) String search) {
        UUID correlation = correlationId(http);
        try {
            var result = service.list(status, supervisorId, territoryId, search, page, pageSize, actor);
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(new Page(result.items().stream().map(Response::from).toList(), PageInfo.from(page, pageSize, result.total())));
        } catch (SellerService.Forbidden exception) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        }
    }

    @GetMapping("/{sellerId}")
    public ResponseEntity<?> get(@PathVariable UUID sellerId, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            return service.get(sellerId, actor).<ResponseEntity<?>>map(value -> ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(Response.from(value))).orElseGet(() -> problem(HttpStatus.NOT_FOUND, correlation));
        } catch (SellerService.Forbidden exception) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (SellerService.Invalid exception) {
            return problem(HttpStatus.BAD_REQUEST, correlation);
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Create request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            return ResponseEntity.accepted().header("X-Correlation-Id", correlation.toString()).body(Response.from(service.create(new SellerService.Command(request.displayName(), request.username(), request.email(), request.phone(), request.employeeCode(), request.supervisorId(), request.territoryIds()), actor, correlation)));
        } catch (SellerService.Forbidden e) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (SellerService.Conflict e) {
            return problem(HttpStatus.CONFLICT, correlation);
        } catch (RuntimeException e) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        }
    }

    @PatchMapping("/{sellerId}")
    public ResponseEntity<?> update(@PathVariable UUID sellerId, @RequestHeader("If-Match") String ifMatch,
                                    @Valid @RequestBody Update request, @AuthenticationPrincipal AuthenticatedActor actor,
                                    HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            if (!request.hasChanges()) return problem(HttpStatus.BAD_REQUEST, correlation);
            Seller seller = service.update(sellerId, new SellerService.Update(request.displayName(), request.phone(), request.employeeCode()),
                    Long.parseLong(ifMatch.replace("\"", "")), actor, correlation);
            return ResponseEntity.ok().eTag(Long.toString(seller.version())).header("X-Correlation-Id", correlation.toString()).body(Response.from(seller));
        } catch (IllegalArgumentException exception) {
            return problem(HttpStatus.BAD_REQUEST, correlation);
        } catch (SellerService.Forbidden exception) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (SellerService.NotFound exception) {
            return problem(HttpStatus.NOT_FOUND, correlation);
        } catch (SellerService.Conflict | DataIntegrityViolationException exception) {
            return problem(HttpStatus.CONFLICT, correlation);
        }
    }

    @PatchMapping("/{sellerId}/status")
    public ResponseEntity<?> status(@PathVariable UUID sellerId, @Valid @RequestBody StatusRequest request,
                                    @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            Seller seller = service.status(sellerId, request.status(), request.reason(), actor, correlation);
            return ResponseEntity.ok().eTag(Long.toString(seller.version())).header("X-Correlation-Id", correlation.toString()).body(Response.from(seller));
        } catch (SellerService.Forbidden exception) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (SellerService.NotFound exception) {
            return problem(HttpStatus.NOT_FOUND, correlation);
        } catch (SellerService.Conflict exception) {
            return problem(HttpStatus.CONFLICT, correlation);
        } catch (SellerService.Invalid | IllegalArgumentException exception) {
            return problem(HttpStatus.BAD_REQUEST, correlation);
        }
    }

    @PutMapping("/{sellerId}/supervisor")
    public ResponseEntity<?> assignSupervisor(@PathVariable UUID sellerId, @Valid @RequestBody AssignSupervisorRequest request,
                                              @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            if (!request.present()) return problem(HttpStatus.BAD_REQUEST, correlation);
            Seller seller = service.assignSupervisor(sellerId, request.supervisorId(), actor, correlation);
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(Response.from(seller));
        } catch (SellerService.Forbidden exception) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (SellerService.NotFound exception) {
            return problem(HttpStatus.NOT_FOUND, correlation);
        } catch (SellerService.Invalid exception) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        } catch (SellerService.Conflict exception) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        }
    }

    @PutMapping("/{sellerId}/territories")
    public ResponseEntity<?> assignTerritories(@PathVariable UUID sellerId, @Valid @RequestBody AssignTerritoriesRequest request,
                                               @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            Seller seller = service.assignTerritories(sellerId, request.territoryIds(), actor, correlation);
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(Response.from(seller));
        } catch (SellerService.Forbidden exception) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (SellerService.NotFound exception) {
            return problem(HttpStatus.NOT_FOUND, correlation);
        } catch (SellerService.Invalid | Seller.InactiveForAssignment exception) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        } catch (SellerService.Conflict exception) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        }
    }

    static ResponseEntity<ProblemDetail> problem(HttpStatus status, UUID correlation) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, "Request cannot be processed");
        p.setProperty("correlationId", correlation.toString());
        return ResponseEntity.status(status).header("X-Correlation-Id", correlation.toString()).body(p);
    }

    static UUID correlationId(HttpServletRequest request) {
        Object current = request.getAttribute("com.nahui.followupbussiness.request.correlationId");
        if (current instanceof UUID value) return value;
        UUID correlation;
        try {
            correlation = UUID.fromString(request.getHeader("X-Correlation-Id"));
        } catch (Exception ignored) {
            correlation = UUID.randomUUID();
        }
        request.setAttribute("com.nahui.followupbussiness.request.correlationId", correlation);
        return correlation;
    }

    record Create(@NotBlank @Size(min = 2, max = 160) String displayName, @Size(min = 3, max = 100) String username,
                  @NotBlank @Email @Size(max = 254) String email, @Size(max = 30) String phone,
                  @Size(max = 50) String employeeCode, UUID supervisorId, List<UUID> territoryIds) {
    }

    static final class Update {
        @Size(min = 2, max = 160)
        private String displayName;
        @Size(max = 30)
        private String phone;
        @Size(max = 50)
        private String employeeCode;

        public String displayName() {
            return displayName;
        }

        public String phone() {
            return phone;
        }

        public String employeeCode() {
            return employeeCode;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public void setEmployeeCode(String employeeCode) {
            this.employeeCode = employeeCode;
        }

        public boolean hasChanges() {
            return displayName != null || phone != null || employeeCode != null;
        }

        @JsonAnySetter
        void unknown(String key, Object ignored) {
            throw new IllegalArgumentException("unknown property");
        }
    }

    static final class StatusRequest {
        @NotNull
        private TerritoryStatus status;
        @NotBlank
        @Size(min = 5, max = 500)
        private String reason;

        public TerritoryStatus status() { return status; }
        public String reason() { return reason; }
        public void setStatus(TerritoryStatus status) { this.status = status; }
        public void setReason(String reason) { this.reason = reason; }

        @JsonAnySetter
        void unknown(String key, Object ignored) { throw new IllegalArgumentException("unknown property"); }
    }

    static final class AssignSupervisorRequest {
        private UUID supervisorId;
        private boolean present;

        UUID supervisorId() { return supervisorId; }
        boolean present() { return present; }
        public void setSupervisorId(UUID supervisorId) { this.supervisorId = supervisorId; this.present = true; }

        @JsonAnySetter
        void unknown(String key, Object ignored) { throw new IllegalArgumentException("unknown property"); }
    }

    record AssignTerritoriesRequest(@NotNull @Size(min = 1) List<UUID> territoryIds) { }

    record Response(UUID id, UUID userId, String displayName, String email, String phone, String employeeCode,
                    UUID supervisorId, List<UUID> territoryIds, String status, Instant createdAt, Instant updatedAt,
                    long version) {
        static Response from(Seller s) {
            return new Response(s.id(), s.userId(), s.displayName(), s.email(), s.phone(), s.employeeCode(), s.supervisorId(), s.territoryIds(), s.status().name(), s.createdAt(), s.updatedAt(), s.version());
        }
    }

    record Page(List<Response> items, PageInfo page) {
    }

    record PageInfo(int page, int pageSize, long totalElements, long totalPages) {
        static PageInfo from(int page, int pageSize, long total) {
            return new PageInfo(page, pageSize, total, total == 0 ? 0 : (total + pageSize - 1) / pageSize);
        }
    }
}
