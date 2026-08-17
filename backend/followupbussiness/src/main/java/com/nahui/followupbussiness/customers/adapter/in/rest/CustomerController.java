package com.nahui.followupbussiness.customers.adapter.in.rest;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.customers.domain.Customer;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customers")
public final class CustomerController {
    private final CreateCustomerService service;
    public CustomerController(CreateCustomerService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Create request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation = correlationId(http);
        try {
            Customer customer = service.create(request.command(), actor);
            return ResponseEntity.status(HttpStatus.CREATED).header("X-Correlation-Id", correlation.toString()).body(Response.from(customer));
        } catch (CreateCustomerService.Forbidden e) { return problem(HttpStatus.FORBIDDEN, correlation); }
        catch (CreateCustomerService.Invalid e) { return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation); }
        catch (CreateCustomerService.InvalidTerritory e) { return problem(HttpStatus.UNPROCESSABLE_CONTENT, correlation); }
    }
    static ResponseEntity<ProblemDetail> problem(HttpStatus status, UUID correlation) { ProblemDetail p = ProblemDetail.forStatusAndDetail(status, "Request cannot be processed"); p.setProperty("correlationId", correlation.toString()); return ResponseEntity.status(status).header("X-Correlation-Id", correlation.toString()).body(p); }
    static UUID correlationId(HttpServletRequest request) { Object value = request.getAttribute("com.nahui.followupbussiness.request.correlationId"); if (value instanceof UUID id) return id; UUID id; try { id = UUID.fromString(request.getHeader("X-Correlation-Id")); } catch (Exception ignored) { id = UUID.randomUUID(); } request.setAttribute("com.nahui.followupbussiness.request.correlationId", id); return id; }

    static final class Create {
        @NotBlank @Size(min = 2, max = 200) private String name;
        @Size(max = 30) private String documentType;
        @Size(max = 40) private String documentNumber;
        @Size(max = 30) private String phone;
        @Email @Size(max = 254) private String email;
        @NotBlank @Size(min = 3, max = 300) private String address;
        @Valid @NotNull private Location location;
        @Min(1) @Max(365) private Integer visitFrequencyDays;
        private UUID territoryId;
        public void setName(String x) { name = x; } public void setDocumentType(String x) { documentType = x; } public void setDocumentNumber(String x) { documentNumber = x; } public void setPhone(String x) { phone = x; } public void setEmail(String x) { email = x; } public void setAddress(String x) { address = x; } public void setLocation(Location x) { location = x; } public void setVisitFrequencyDays(Integer x) { visitFrequencyDays = x; } public void setTerritoryId(UUID x) { territoryId = x; }
        CreateCustomerService.Command command() { return new CreateCustomerService.Command(name, documentType, documentNumber, phone, email, address, location.point(), visitFrequencyDays, territoryId); }
        @JsonAnySetter void unknown(String key, Object ignored) { throw new IllegalArgumentException("unknown property"); }
    }
    static final class Location {
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") private Double latitude;
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") private Double longitude;
        public void setLatitude(Double x) { latitude = x; } public void setLongitude(Double x) { longitude = x; }
        GeoPoint point() { return new GeoPoint(latitude, longitude); }
        @JsonAnySetter void unknown(String key, Object ignored) { throw new IllegalArgumentException("unknown property"); }
    }
    record Response(UUID id, String name, String documentType, String documentNumber, String phone, String email, String address, GeoPoint location, Integer visitFrequencyDays, UUID territoryId, List<UUID> assignedSellerIds, String status, Instant createdAt, Instant updatedAt, long version) { static Response from(Customer c) { return new Response(c.id(), c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.address(), c.location(), c.visitFrequencyDays(), c.territoryId(), List.of(), "ACTIVE", c.createdAt(), c.updatedAt(), c.version()); } }
}
