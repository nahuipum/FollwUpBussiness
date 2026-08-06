package com.nahui.followupbussiness.tenancy.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.tenancy.application.CreateCompanyCommand;
import com.nahui.followupbussiness.tenancy.application.CreateCompanyService;
import com.nahui.followupbussiness.tenancy.application.port.in.CreateCompanyUseCase;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.time.Instant;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/platform/companies")
@ConditionalOnBean(CreateCompanyUseCase.class)
public final class CompanyController {
    static final String CORRELATION_ID_ATTRIBUTE = "com.nahui.followupbussiness.request.correlationId";
    private final CreateCompanyUseCase service;
    public CompanyController(CreateCompanyUseCase service) { this.service = service; }

    @PostMapping
    ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedActor actor, @Valid @RequestBody CreateCompanyRequest request,
                             HttpServletRequest servletRequest) {
        UUID correlation = correlationId(servletRequest);
        try {
            var result = service.execute(new CreateCompanyCommand(request.legalName(), request.tradeName(), request.code(), request.taxId(),
                    new CompanySettings(request.settings().timezone(), request.settings().currency(), request.settings().geofenceRadiusMeters(),
                            request.settings().trackingIntervalSeconds(), 90, request.settings().saleEditWindowMinutes())), actor);
            if (result.conflict()) return problem(HttpStatus.CONFLICT, correlation);
            Company company = result.company();
            return ResponseEntity.created(URI.create("/platform/companies/" + company.id()))
                    .header("X-Correlation-Id", correlation.toString()).body(CompanyResponse.from(company));
        } catch (IllegalArgumentException e) { return problem(HttpStatus.UNPROCESSABLE_ENTITY, correlation); }
        catch (CreateCompanyService.AccessDeniedException e) { return problem(HttpStatus.FORBIDDEN, correlation); }
    }

    static ResponseEntity<ProblemDetail> problem(HttpStatus status, UUID correlation) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, "Request cannot be processed");
        problem.setType(URI.create("urn:followupbussiness:company:invalid"));
        problem.setProperty("code", status == HttpStatus.CONFLICT ? "COMPANY_CONFLICT" : "COMPANY_INVALID");
        problem.setProperty("correlationId", correlation.toString());
        return ResponseEntity.status(status).header(HttpHeaders.CACHE_CONTROL, "no-store").header("X-Correlation-Id", correlation.toString()).body(problem);
    }
    static UUID correlationId(HttpServletRequest request) {
        Object existing = request.getAttribute(CORRELATION_ID_ATTRIBUTE);
        if (existing instanceof UUID correlation) return correlation;
        UUID correlation = correlationId(request.getHeader("X-Correlation-Id"));
        request.setAttribute(CORRELATION_ID_ATTRIBUTE, correlation);
        return correlation;
    }
    static UUID correlationId(String supplied) { try { return UUID.fromString(supplied); } catch (Exception e) { return UUID.randomUUID(); } }

    record CreateCompanyRequest(@NotBlank @Size(min = 2, max = 200) String legalName, @Size(max = 200) String tradeName,
            @NotBlank @Pattern(regexp = "[A-Z0-9][A-Z0-9_-]{2,39}") String code, @Size(max = 30) String taxId,
            @NotNull @Valid SettingsRequest settings) { }
    record SettingsRequest(@NotBlank @Size(max = 100) String timezone, @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency,
            @Min(100) @Max(100) int geofenceRadiusMeters, @Min(60) @Max(60) int trackingIntervalSeconds,
            @Min(0) @Max(10080) Integer saleEditWindowMinutes) { }
    record CompanyResponse(UUID id, String legalName, String tradeName, String code, String taxId, String status,
            SettingsResponse settings, Instant createdAt, Instant updatedAt, long version) {
        static CompanyResponse from(Company company) { return new CompanyResponse(company.id(), company.legalName(), company.tradeName(), company.code(),
                company.taxId(), company.status().name(), new SettingsResponse(company.settings().timezone(), company.settings().currency(),
                company.settings().geofenceRadiusMeters(), company.settings().trackingIntervalSeconds(), company.settings().locationRetentionDays(),
                company.settings().saleEditWindowMinutes()), company.createdAt(), company.updatedAt(), company.version()); }
    }
    record SettingsResponse(String timezone, String currency, int geofenceRadiusMeters, int trackingIntervalSeconds,
            int locationRetentionDays, Integer saleEditWindowMinutes) { }
}
