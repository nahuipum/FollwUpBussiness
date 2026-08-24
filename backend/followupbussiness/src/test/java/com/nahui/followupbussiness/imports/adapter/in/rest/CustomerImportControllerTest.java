package com.nahui.followupbussiness.imports.adapter.in.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.imports.application.port.in.CreateCustomerImportUseCase;
import com.nahui.followupbussiness.imports.application.port.in.GetCustomerImportUseCase;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;

class CustomerImportControllerTest {
    @Test void oversizedFileIsReportedAsContractual413() {
        CreateCustomerImportUseCase create = mock(CreateCustomerImportUseCase.class);
        when(create.create(any(), any(), any())).thenThrow(new CreateCustomerImportUseCase.PayloadTooLarge());
        var controller = new CustomerImportController(create, mock(GetCustomerImportUseCase.class));
        var response = controller.create(new MockMultipartFile("file", "customers.csv", "text/csv", new byte[]{1}), "1.0", true, "key", new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN), new MockHttpServletRequest());
        assertThat(response.getStatusCode().value()).isEqualTo(413);
    }
}
