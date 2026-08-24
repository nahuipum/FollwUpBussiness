package com.nahui.followupbussiness.imports.adapter.in.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.imports.application.port.in.CreateCustomerImportUseCase;
import com.nahui.followupbussiness.imports.application.port.in.GetCustomerImportUseCase;
import com.nahui.followupbussiness.imports.application.port.in.DownloadCustomerImportErrorsUseCase;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;

class CustomerImportControllerTest {
    @Test void exposesSafeFailureReasonInTheJobView() {
        UUID importId = UUID.randomUUID();
        Instant created = Instant.parse("2026-08-24T10:00:00Z"), completed = Instant.parse("2026-08-24T10:01:00Z"), expires = Instant.parse("2026-09-23T10:01:00Z");
        CustomerImport job = new CustomerImport(importId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "key", "customers.csv", "text/csv", "1.0", true, "0".repeat(64), CustomerImport.Status.FAILED, null, 0, 1, created, completed, completed, expires, CustomerImport.FailureReason.INVALID_TEMPLATE);
        GetCustomerImportUseCase get = mock(GetCustomerImportUseCase.class);
        when(get.get(any(), any())).thenReturn(java.util.Optional.of(job));
        var controller = new CustomerImportController(mock(CreateCustomerImportUseCase.class), get, mock(DownloadCustomerImportErrorsUseCase.class));

        var response = controller.get(importId, new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), new MockHttpServletRequest());

        assertThat(response.getBody()).isEqualTo(new CustomerImportController.View(importId, "FAILED", null, 0, 1, created, completed, expires, CustomerImport.FailureReason.INVALID_TEMPLATE));
    }

    @Test void postDoesNotExposeFailureReasonBeforeProcessing() {
        UUID importId = UUID.randomUUID();
        CustomerImport pending = new CustomerImport(importId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "key", "customers.csv", "text/csv", "1.0", true, "0".repeat(64), CustomerImport.Status.PENDING, 0, 0, Instant.now(), Instant.now(), null, null);
        CreateCustomerImportUseCase create = mock(CreateCustomerImportUseCase.class);
        when(create.create(any(), any(), any())).thenReturn(pending);
        var controller = new CustomerImportController(create, mock(GetCustomerImportUseCase.class), mock(DownloadCustomerImportErrorsUseCase.class));

        var response = controller.create(new MockMultipartFile("file", "customers.csv", "text/csv", new byte[]{1}), "1.0", true, "key", new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), new MockHttpServletRequest());

        assertThat(response.getStatusCode().value()).isEqualTo(202);
        assertThat(((CustomerImportController.View) response.getBody()).failureReason()).isNull();
    }

    @Test void oversizedFileIsReportedAsContractual413() {
        CreateCustomerImportUseCase create = mock(CreateCustomerImportUseCase.class);
        when(create.create(any(), any(), any())).thenThrow(new CreateCustomerImportUseCase.PayloadTooLarge());
        var controller = new CustomerImportController(create, mock(GetCustomerImportUseCase.class), mock(DownloadCustomerImportErrorsUseCase.class));
        var response = controller.create(new MockMultipartFile("file", "customers.csv", "text/csv", new byte[]{1}), "1.0", true, "key", new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), new MockHttpServletRequest());
        assertThat(response.getStatusCode().value()).isEqualTo(413);
    }
    @Test void errorsUseContractualGoneAndNeutralNotFoundWithoutCsv() {
        DownloadCustomerImportErrorsUseCase errors = mock(DownloadCustomerImportErrorsUseCase.class);
        UUID id = UUID.randomUUID();
        when(errors.download(any(), any())).thenThrow(new DownloadCustomerImportErrorsUseCase.Expired());
        var controller = new CustomerImportController(mock(CreateCustomerImportUseCase.class), mock(GetCustomerImportUseCase.class), errors);
        var expired = controller.errors(id, new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), new MockHttpServletRequest());
        assertThat(expired.getStatusCode().value()).isEqualTo(410);
        doThrow(new DownloadCustomerImportErrorsUseCase.NotFound()).when(errors).download(any(), any());
        var missing = controller.errors(id, new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), new MockHttpServletRequest());
        assertThat(missing.getStatusCode().value()).isEqualTo(404);
        assertThat(missing.getBody()).isInstanceOf(org.springframework.http.ProblemDetail.class);
    }
}
