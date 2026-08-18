package com.nahui.followupbussiness.customers.adapter.in.rest;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.customers.application.UpdateCustomerService;
import com.nahui.followupbussiness.customers.application.CheckCustomerDuplicatesService;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.workforce.application.port.in.PortfolioAccessScopeUseCase;
import com.nahui.followupbussiness.customers.application.port.out.CustomerStore;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/customers")
public final class CustomerController {
    private final CreateCustomerService service;
    private final UpdateCustomerService updates;
    private final CheckCustomerDuplicatesService duplicates;
    private final CustomerPortfolioReadUseCase portfolio;
    private final PortfolioAccessScopeUseCase scopes;

    public CustomerController(CreateCustomerService service, UpdateCustomerService updates, CheckCustomerDuplicatesService duplicates, CustomerPortfolioReadUseCase portfolio, PortfolioAccessScopeUseCase scopes) {
        this.service = service;
        this.updates = updates;
        this.duplicates = duplicates;
        this.portfolio = portfolio;
        this.scopes = scopes;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int pageSize,
                                  @RequestParam(required = false) String search, @RequestParam(required = false) String status,
                                  @RequestParam(required = false) UUID territoryId, @RequestParam(required = false) UUID sellerId,
                                  @RequestParam(required = false) String segment,
                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate withoutVisitSince,
                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate withoutPurchaseSince,
                                  @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            if (page < 0 || pageSize < 1 || pageSize > 200 || (search != null && (search.isBlank() || search.length() > 120)) || (segment != null && segment.length() > 80) || (status != null && !status.equals("ACTIVE") && !status.equals("INACTIVE")))
                throw new IllegalArgumentException();
            var scope = scopes.resolve(actor);
            var result = portfolio.read(new CustomerPortfolioReadUseCase.Query(search, status, territoryId, sellerId, segment, withoutVisitSince, withoutPurchaseSince, Math.multiplyExact(page, pageSize), pageSize), new CustomerPortfolioReadUseCase.Scope(scope.tenantId(), scope.allCurrentPortfolios(), scope.sellerIds()));
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(new PageResponse(result.items().stream().map(Response::from).toList(), new PageInfo(page, pageSize, result.total(), (result.total() + pageSize - 1) / pageSize)));
        } catch (PortfolioAccessScopeUseCase.Forbidden | CustomerPortfolioReadUseCase.Forbidden e) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (IllegalArgumentException | ArithmeticException e) {
            return problem(HttpStatus.BAD_REQUEST, correlation);
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Create request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            Customer customer = service.create(request.command(), actor);
            return ResponseEntity.status(HttpStatus.CREATED).header("X-Correlation-Id", correlation.toString()).body(Response.from(customer));
        } catch (CreateCustomerService.Forbidden e) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (CreateCustomerService.Invalid e) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        } catch (CreateCustomerService.InvalidTerritory e) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        }
    }

    @PatchMapping("/{customerId}")
    public ResponseEntity<?> update(@PathVariable UUID customerId, @RequestHeader("If-Match") String ifMatch, @Valid @RequestBody Update request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            long version = parseVersion(ifMatch);
            Customer customer = updates.update(customerId, version, request.patch(), actor);
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(Response.from(customer));
        } catch (UpdateCustomerService.Forbidden e) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (UpdateCustomerService.NotFound e) {
            return problem(HttpStatus.NOT_FOUND, correlation);
        } catch (UpdateCustomerService.Conflict e) {
            return problem(HttpStatus.CONFLICT, correlation);
        } catch (UpdateCustomerService.InvalidTerritory | IllegalArgumentException e) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        }
    }

    @PostMapping("/duplicate-checks")
    public ResponseEntity<?> duplicateChecks(@Valid @RequestBody DuplicateCheck request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            CheckCustomerDuplicatesService.Result result = duplicates.check(request.command(), actor);
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(DuplicateResponse.from(result));
        } catch (CheckCustomerDuplicatesService.Forbidden e) {
            return problem(HttpStatus.FORBIDDEN, correlation);
        } catch (CheckCustomerDuplicatesService.Invalid e) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation);
        }
    }

    private static long parseVersion(String value) {
        if (value == null || !value.matches("^\\\"[1-9][0-9]*\\\"$"))
            throw new IllegalArgumentException("invalid version");
        return Long.parseLong(value.substring(1, value.length() - 1));
    }

    static ResponseEntity<ProblemDetail> problem(HttpStatus status, UUID correlation) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, "Request cannot be processed");
        p.setProperty("correlationId", correlation.toString());
        return ResponseEntity.status(status).header("X-Correlation-Id", correlation.toString()).body(p);
    }

    static UUID correlationId(HttpServletRequest request) {
        Object value = request.getAttribute("com.nahui.followupbussiness.request.correlationId");
        if (value instanceof UUID id) return id;
        UUID id;
        try {
            id = UUID.fromString(request.getHeader("X-Correlation-Id"));
        } catch (Exception ignored) {
            id = UUID.randomUUID();
        }
        request.setAttribute("com.nahui.followupbussiness.request.correlationId", id);
        return id;
    }

    static final class Create {
        @NotBlank
        @Size(min = 2, max = 200)
        private String name;
        @Size(max = 30)
        private String documentType;
        @Size(max = 40)
        private String documentNumber;
        @Size(max = 30)
        private String phone;
        @Email
        @Size(max = 254)
        private String email;
        @Size(max = 80)
        private String segment;
        @NotBlank
        @Size(min = 3, max = 300)
        private String address;
        @Valid
        @NotNull
        private Location location;
        @Min(1)
        @Max(365)
        private Integer visitFrequencyDays;
        private UUID territoryId;

        public void setName(String x) {
            name = x;
        }

        public void setDocumentType(String x) {
            documentType = x;
        }

        public void setDocumentNumber(String x) {
            documentNumber = x;
        }

        public void setPhone(String x) {
            phone = x;
        }

        public void setEmail(String x) {
            email = x;
        }

        public void setSegment(String x) {
            segment = x;
        }

        public void setAddress(String x) {
            address = x;
        }

        public void setLocation(Location x) {
            location = x;
        }

        public void setVisitFrequencyDays(Integer x) {
            visitFrequencyDays = x;
        }

        public void setTerritoryId(UUID x) {
            territoryId = x;
        }

        CreateCustomerService.Command command() {
            return new CreateCustomerService.Command(name, documentType, documentNumber, phone, email, segment, address, location.point(), visitFrequencyDays, territoryId);
        }

        @JsonAnySetter
        void unknown(String key, Object ignored) {
            throw new IllegalArgumentException("unknown property");
        }
    }

    static final class Update {
        private String name, documentType, documentNumber, phone, email, segment, address, status;
        @Valid
        private Location location;
        private Integer visitFrequencyDays;
        private UUID territoryId;
        private boolean nameSet, documentTypeSet, documentNumberSet, phoneSet, emailSet, segmentSet, addressSet, locationSet, visitFrequencyDaysSet, territoryIdSet, statusSet;

        public void setName(String x) {
            name = x;
            nameSet = true;
        }

        public void setDocumentType(String x) {
            documentType = x;
            documentTypeSet = true;
        }

        public void setDocumentNumber(String x) {
            documentNumber = x;
            documentNumberSet = true;
        }

        public void setPhone(String x) {
            phone = x;
            phoneSet = true;
        }

        public void setEmail(String x) {
            email = x;
            emailSet = true;
        }

        public void setSegment(String x) {
            segment = x;
            segmentSet = true;
        }

        public void setAddress(String x) {
            address = x;
            addressSet = true;
        }

        public void setLocation(Location x) {
            location = x;
            locationSet = true;
        }

        public void setVisitFrequencyDays(Integer x) {
            visitFrequencyDays = x;
            visitFrequencyDaysSet = true;
        }

        public void setTerritoryId(UUID x) {
            territoryId = x;
            territoryIdSet = true;
        }

        public void setStatus(String x) {
            status = x;
            statusSet = true;
        }

        UpdateCustomerService.Patch patch() {
            if (!(nameSet || documentTypeSet || documentNumberSet || phoneSet || emailSet || segmentSet || addressSet || locationSet || visitFrequencyDaysSet || territoryIdSet || statusSet) || (nameSet && name == null) || (addressSet && address == null) || (locationSet && location == null) || (statusSet && status == null))
                throw new IllegalArgumentException("invalid patch");
            return new UpdateCustomerService.Patch(name, nameSet, documentType, documentTypeSet, documentNumber, documentNumberSet, phone, phoneSet, email, emailSet, segment, segmentSet, address, addressSet, locationSet ? location.point() : null, locationSet, visitFrequencyDays, visitFrequencyDaysSet, territoryId, territoryIdSet, status, statusSet);
        }

        @JsonAnySetter
        void unknown(String key, Object ignored) {
            throw new IllegalArgumentException("unknown property");
        }
    }

    static final class DuplicateCheck {
        @NotBlank
        @Size(min = 2, max = 200)
        private String name;
        @Size(max = 40)
        private String documentNumber;
        @Size(max = 30)
        private String phone;
        @Size(min = 3, max = 300)
        private String address;
        @Valid
        private Location location;
        private UUID excludeCustomerId;

        public void setName(String x) {
            name = x;
        }

        public void setDocumentNumber(String x) {
            documentNumber = x;
        }

        public void setPhone(String x) {
            phone = x;
        }

        public void setAddress(String x) {
            address = x;
        }

        public void setLocation(Location x) {
            location = x;
        }

        public void setExcludeCustomerId(UUID x) {
            excludeCustomerId = x;
        }

        CheckCustomerDuplicatesService.Command command() {
            return new CheckCustomerDuplicatesService.Command(name, documentNumber, phone, address, location == null ? null : location.point(), excludeCustomerId);
        }

        @JsonAnySetter
        void unknown(String key, Object ignored) {
            throw new IllegalArgumentException("unknown property");
        }
    }

    static final class Location {
        @NotNull
        @DecimalMin("-90.0")
        @DecimalMax("90.0")
        private Double latitude;
        @NotNull
        @DecimalMin("-180.0")
        @DecimalMax("180.0")
        private Double longitude;

        public void setLatitude(Double x) {
            latitude = x;
        }

        public void setLongitude(Double x) {
            longitude = x;
        }

        GeoPoint point() {
            return new GeoPoint(latitude, longitude);
        }

        @JsonAnySetter
        void unknown(String key, Object ignored) {
            throw new IllegalArgumentException("unknown property");
        }
    }

    record Response(UUID id, String name, String documentType, String documentNumber, String phone, String email,
                    String segment, String address, GeoPoint location, Integer visitFrequencyDays, UUID territoryId,
                    List<UUID> assignedSellerIds, String status, Instant createdAt, Instant updatedAt, long version) {
        static Response from(Customer c) {
            return new Response(c.id(), c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.segment(), c.address(), c.location(), c.visitFrequencyDays(), c.territoryId(), List.of(), c.status(), c.createdAt(), c.updatedAt(), c.version());
        }
    }

    record PageResponse(List<Response> items, PageInfo page) {
    }

    record PageInfo(int page, int pageSize, long totalElements, long totalPages) {
    }

    record DuplicateResponse(boolean hasPossibleDuplicates, List<DuplicateCandidate> candidates) {
        static DuplicateResponse from(CheckCustomerDuplicatesService.Result result) {
            return new DuplicateResponse(result.hasPossibleDuplicates(), result.candidates().stream().map(candidate -> new DuplicateCandidate(Response.from(candidate.customer()), candidate.score(), candidate.matchedFields())).toList());
        }
    }

    record DuplicateCandidate(Response customer, double score,
                              java.util.Set<CustomerStore.MatchedField> matchedFields) {
    }
}
