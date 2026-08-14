package com.nahui.followupbussiness.tenancy.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.tenancy.application.CreateCompanyCommand;
import com.nahui.followupbussiness.tenancy.application.ChangeCompanyStatusCommand;
import com.nahui.followupbussiness.tenancy.application.ChangeCompanyStatusService;
import com.nahui.followupbussiness.tenancy.application.CreateCompanyService;
import com.nahui.followupbussiness.tenancy.application.port.in.ChangeCompanyStatusUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.CreateCompanyUseCase;
import com.nahui.followupbussiness.tenancy.application.ListCompaniesService;
import com.nahui.followupbussiness.tenancy.application.port.in.ListCompaniesUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.ListCompanyCurrenciesUseCase;
import com.nahui.followupbussiness.tenancy.application.port.in.GetCompanyUseCase;
import com.nahui.followupbussiness.tenancy.application.GetCompanyService;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.validation.annotation.Validated;

@RestController
@Validated
@RequestMapping("/platform/companies")
public class CompanyController {
    static final String CORRELATION_ID_ATTRIBUTE = "com.nahui.followupbussiness.request.correlationId";
    private final CreateCompanyUseCase service;
    private final ChangeCompanyStatusUseCase statusService;
    private final ListCompaniesUseCase listService;
    private final GetCompanyUseCase detailService;
    private final ListCompanyCurrenciesUseCase currencyService;
    @Autowired
    public CompanyController(CreateCompanyUseCase service, ChangeCompanyStatusUseCase statusService, ListCompaniesUseCase listService,
            GetCompanyUseCase detailService, ListCompanyCurrenciesUseCase currencyService) {
        this.service = service;
        this.statusService = statusService;
        this.listService = listService;
        this.detailService = detailService;
        this.currencyService = currencyService;
    }
    CompanyController(CreateCompanyUseCase service, ChangeCompanyStatusUseCase statusService) {
        this(service, statusService, (query, actor) -> { throw new UnsupportedOperationException("List use case is required"); },
                (companyId, actor) -> { throw new UnsupportedOperationException("Detail use case is required"); },
                actor -> { throw new UnsupportedOperationException("Currency use case is required"); });
    }
    CompanyController(CreateCompanyUseCase service, ChangeCompanyStatusUseCase statusService, ListCompaniesUseCase listService) {
        this(service, statusService, listService, (companyId, actor) -> { throw new UnsupportedOperationException("Detail use case is required"); },
                actor -> { throw new UnsupportedOperationException("Currency use case is required"); });
    }

    @GetMapping("/currencies")
    ResponseEntity<?> currencies(@AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest servletRequest) {
        UUID correlation = correlationId(servletRequest);
        try { return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).body(currencyService.execute(actor)); }
        catch (com.nahui.followupbussiness.tenancy.application.ListCompanyCurrenciesService.AccessDeniedException e) { return problem(HttpStatus.FORBIDDEN, correlation); }
    }

    @GetMapping
    ResponseEntity<?> list(@AuthenticationPrincipal AuthenticatedActor actor,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(200) int pageSize,
            @RequestParam(required = false) @Size(min = 1, max = 120) String search,
            @RequestParam(required = false) com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus status,
            HttpServletRequest servletRequest) {
        UUID correlation = correlationId(servletRequest);
        if (page < 0 || pageSize < 1 || pageSize > 200 || (search != null && (search.isBlank() || search.length() > 120))) {
            return problem(HttpStatus.BAD_REQUEST, correlation);
        }
        try {
            var result = listService.execute(new ListCompaniesUseCase.Query(page, pageSize, search, status), actor);
            long totalPages = result.totalElements() == 0 ? 0 : (result.totalElements() + pageSize - 1) / pageSize;
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString())
                    .body(new CompanyPageResponse(result.items().stream().map(CompanyResponse::from).toList(),
                            new PageInfoResponse(page, pageSize, result.totalElements(), totalPages)));
        } catch (ListCompaniesService.AccessDeniedException e) { return problem(HttpStatus.FORBIDDEN, correlation); }
    }

    @GetMapping("/{companyId}")
    ResponseEntity<?> detail(@PathVariable UUID companyId, @AuthenticationPrincipal AuthenticatedActor actor,
            HttpServletRequest servletRequest) {
        UUID correlation = correlationId(servletRequest);
        try {
            return detailService.execute(companyId, actor)
                    .<ResponseEntity<?>>map(company -> ResponseEntity.ok().header("X-Correlation-Id", correlation.toString())
                            .body(CompanyResponse.from(company)))
                    .orElseGet(() -> problem(HttpStatus.NOT_FOUND, correlation));
        } catch (GetCompanyService.AccessDeniedException e) { return problem(HttpStatus.FORBIDDEN, correlation); }
    }

    @PostMapping
    ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedActor actor, @Valid @RequestBody CreateCompanyRequest request,
                             HttpServletRequest servletRequest) {
        UUID correlation = correlationId(servletRequest);
        try {
            var result = service.execute(new CreateCompanyCommand(request.legalName(), request.tradeName(), request.taxId(),
                    new CompanySettings(request.settings().timezone(), request.settings().currency(), request.settings().geofenceRadiusMeters(),
                            request.settings().trackingIntervalSeconds(), 90, request.settings().saleEditWindowMinutes())), actor);
            if (result.conflict()) return problem(HttpStatus.CONFLICT, correlation);
            Company company = result.company();
            return ResponseEntity.created(URI.create("/platform/companies/" + company.id()))
                    .header("X-Correlation-Id", correlation.toString()).body(CompanyResponse.from(company));
        } catch (IllegalArgumentException e) { return problem(HttpStatus.UNPROCESSABLE_ENTITY, correlation); }
        catch (CreateCompanyService.AccessDeniedException e) { return problem(HttpStatus.FORBIDDEN, correlation); }
    }

    @PatchMapping("/{companyId}/status")
    ResponseEntity<?> changeStatus(@PathVariable UUID companyId, @AuthenticationPrincipal AuthenticatedActor actor,
            @Valid @RequestBody ChangeCompanyStatusRequest request, HttpServletRequest servletRequest) {
        UUID correlation = correlationId(servletRequest);
        try {
            var result = statusService.execute(companyId,
                    new ChangeCompanyStatusCommand(request.status(), request.reason()), actor);
            if (!result.found()) return problem(HttpStatus.NOT_FOUND, correlation);
            return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString())
                    .body(CompanyResponse.from(result.company()));
        } catch (IllegalArgumentException e) { return problem(HttpStatus.UNPROCESSABLE_ENTITY, correlation); }
        catch (ChangeCompanyStatusService.AccessDeniedException e) { return problem(HttpStatus.FORBIDDEN, correlation); }
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
            @Size(max = 30) String taxId,
            @NotNull @Valid SettingsRequest settings) { }
    record ChangeCompanyStatusRequest(@NotNull com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus status,
            @NotBlank @Size(min = 5, max = 500) String reason) { }
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
    record CompanyPageResponse(java.util.List<CompanyResponse> items, PageInfoResponse page) { }
    record PageInfoResponse(int page, int pageSize, long totalElements, long totalPages) { }
}
