package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import static org.mockito.Mockito.*;
import com.nahui.followupbussiness.identityaccess.application.port.in.ProvisionInitialCompanyAdminUseCase;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class InitialCompanyAdminControllerTest {
    @Test void rejectsRoleTenantAndCompanyInjectionBeforeUseCase() throws Exception {
        var service=mock(ProvisionInitialCompanyAdminUseCase.class);
        var mvc=MockMvcBuilders.standaloneSetup(new InitialCompanyAdminController(service)).build();
        for (String field : new String[]{"role","tenantId","companyId"}) mvc.perform(post("/platform/companies/{id}/initial-admin",UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"displayName\":\"Admin\",\"email\":\"admin@example.test\",\""+field+"\":\"injected\"}")).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
