package com.nahui.followupbussiness.tenancy.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.tenancy.application.CompanySettingsService;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanySettingsUseCase;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import tools.jackson.databind.JsonNode;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.http.converter.HttpMessageNotReadableException;

@RestController
@RequestMapping("/company/settings")
public final class CompanySettingsController {
    private final CompanySettingsUseCase service;
    private final Counter rejected;
    public CompanySettingsController(CompanySettingsUseCase service, MeterRegistry meters) {
        this.service = service;
        this.rejected = meters.counter("company.settings.rejected");
    }

    @GetMapping
    ResponseEntity<?> get(@AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest request) {
        UUID correlation = CompanyController.correlationId(request);
        try {
            return service.get(actor).<ResponseEntity<?>>map(company -> ResponseEntity.ok().eTag(Long.toString(company.version()))
                    .header("X-Correlation-Id", correlation.toString()).body(Response.from(company.settings())))
                    .orElseGet(() -> CompanyController.problem(HttpStatus.FORBIDDEN, correlation));
        } catch (CompanySettingsService.AccessDeniedException exception) {
            return CompanyController.problem(HttpStatus.FORBIDDEN, correlation);
        } catch (CompanySettingsService.NotFoundException exception) {
            return CompanyController.problem(HttpStatus.FORBIDDEN, correlation);
        }
    }

    @PatchMapping
    ResponseEntity<?> update(@RequestHeader(value = "X-Correlation-Id", required = false) String suppliedCorrelation,
                             @RequestHeader(value = "If-Match", required = false) String ifMatch,
                             @AuthenticationPrincipal AuthenticatedActor actor, @RequestBody JsonNode request,
                             HttpServletRequest servletRequest) {
        UUID correlation = CompanyController.correlationId(servletRequest);
        if (suppliedCorrelation == null || ifMatch == null || request == null || !request.isObject() || request.isEmpty())
            return rejected(correlation);
        if (!validSaleEditWindow(request)) return rejected(correlation);
        try {
            long version = Long.parseLong(ifMatch.replace("\"", ""));
            var company = service.update(new CompanySettingsUseCase.Update(text(request, "timezone"), text(request, "currency"),
                    integer(request, "geofenceRadiusMeters"), request.has("geofenceRadiusMeters"),
                    integer(request, "trackingIntervalSeconds"), request.has("trackingIntervalSeconds"),
                    integer(request, "locationRetentionDays"), request.has("locationRetentionDays"),
                    integer(request, "saleEditWindowMinutes"), request.has("saleEditWindowMinutes"), version), actor);
            return ResponseEntity.ok().eTag(Long.toString(company.version())).header("X-Correlation-Id", correlation.toString())
                    .body(Response.from(company.settings()));
        } catch (NumberFormatException | CompanySettingsService.InvalidUpdateException exception) {
            return exception instanceof NumberFormatException ? rejected(correlation) : CompanyController.problem(HttpStatus.UNPROCESSABLE_ENTITY, correlation);
        } catch (CompanySettingsService.AccessDeniedException exception) {
            return CompanyController.problem(HttpStatus.FORBIDDEN, correlation);
        } catch (CompanySettingsService.NotFoundException exception) {
            return CompanyController.problem(HttpStatus.FORBIDDEN, correlation);
        } catch (CompanySettingsService.ConflictException exception) {
            return CompanyController.problem(HttpStatus.CONFLICT, correlation);
        }
    }

    record Response(String timezone, String currency, int geofenceRadiusMeters, int trackingIntervalSeconds,
                    int locationRetentionDays, Integer saleEditWindowMinutes) {
        static Response from(CompanySettings settings) { return new Response(settings.timezone(), settings.currency(),
                settings.geofenceRadiusMeters(), settings.trackingIntervalSeconds(), settings.locationRetentionDays(), settings.saleEditWindowMinutes()); }
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<?> unreadable(HttpServletRequest request) {
        return rejected(CompanyController.correlationId(request));
    }

    private ResponseEntity<?> rejected(UUID correlation) {
        rejected.increment();
        return CompanyController.problem(HttpStatus.UNPROCESSABLE_ENTITY, correlation);
    }
    private static String text(JsonNode request, String field) {
        JsonNode value = request.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
    private static Integer integer(JsonNode request, String field) {
        JsonNode value = request.get(field);
        return value == null || value.isNull() || !value.canConvertToInt() ? null : value.intValue();
    }
    private static boolean validSaleEditWindow(JsonNode request) {
        if (!request.has("saleEditWindowMinutes")) return true;
        JsonNode value = request.get("saleEditWindowMinutes");
        return value != null && value.isIntegralNumber() && value.canConvertToInt()
                && value.intValue() >= 0 && value.intValue() <= 10080;
    }
}
