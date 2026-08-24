package com.nahui.followupbussiness.customers.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.imports.application.port.in.DownloadCustomerImportTemplateUseCase;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/customers")
public final class CustomerImportTemplateController {
    private static final MediaType XLSX = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private final DownloadCustomerImportTemplateUseCase templates;
    public CustomerImportTemplateController(DownloadCustomerImportTemplateUseCase templates) { this.templates = templates; }

    @GetMapping("/import-template")
    public ResponseEntity<?> download(@AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest request) {
        UUID correlation = CustomerController.correlationId(request);
        if (actor == null || actor.role() != BaseRole.COMPANY_ADMIN) return CustomerController.problem(HttpStatus.FORBIDDEN, correlation);
        DownloadCustomerImportTemplateUseCase.Format format = format(request.getHeader(HttpHeaders.ACCEPT));
        if (format == null) return CustomerController.problem(HttpStatus.NOT_ACCEPTABLE, correlation);
        var template = templates.download(format);
        return ResponseEntity.ok().header("X-Correlation-Id", correlation.toString()).header("X-Template-Version", template.version())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + template.filename() + "\"")
                .contentType(MediaType.parseMediaType(template.contentType())).contentLength(template.content().length).body(template.content());
    }
    private static DownloadCustomerImportTemplateUseCase.Format format(String accept) {
        if (accept == null || accept.isBlank()) return DownloadCustomerImportTemplateUseCase.Format.CSV;
        try {
            List<MediaType> accepted = MediaType.parseMediaTypes(accept);
            if (accepted.isEmpty()) return DownloadCustomerImportTemplateUseCase.Format.CSV;
            double csv = quality(accepted, MediaType.valueOf("text/csv"));
            double xlsx = quality(accepted, XLSX);
            if (csv <= 0 && xlsx <= 0) return null;
            return xlsx > csv ? DownloadCustomerImportTemplateUseCase.Format.XLSX : DownloadCustomerImportTemplateUseCase.Format.CSV;
        } catch (IllegalArgumentException invalid) { return null; }
    }
    private static double quality(List<MediaType> accepted, MediaType candidate) {
        int specificity = accepted.stream().filter(media -> media.isCompatibleWith(candidate)).mapToInt(CustomerImportTemplateController::specificity).max().orElse(-1);
        return specificity < 0 ? 0 : accepted.stream().filter(media -> media.isCompatibleWith(candidate) && specificity(media) == specificity).mapToDouble(MediaType::getQualityValue).max().orElse(0);
    }
    private static int specificity(MediaType media) { return media.isWildcardType() ? 0 : media.isWildcardSubtype() ? 1 : 2; }
}
