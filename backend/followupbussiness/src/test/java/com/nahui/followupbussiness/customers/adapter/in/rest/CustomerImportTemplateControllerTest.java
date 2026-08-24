package com.nahui.followupbussiness.customers.adapter.in.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.imports.application.CustomerImportTemplateService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipInputStream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CustomerImportTemplateControllerTest {
    private MockMvc mvc;
    @BeforeEach void setUp() { mvc = MockMvcBuilders.standaloneSetup(new CustomerImportTemplateController(new CustomerImportTemplateService())).setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build(); }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void adminGetsDefaultUtf8CsvWithExactVersionedContractAndSafeExample() throws Exception {
        authenticate(BaseRole.COMPANY_ADMIN);
        var result = mvc.perform(get("/customers/import-template")).andExpect(status().isOk()).andExpect(header().string("X-Template-Version", "1.0"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"customer-import-template-1.0.csv\""))
                .andExpect(content().contentTypeCompatibleWith("text/csv")).andReturn();
        String csv = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(csv).isEqualTo("# template-version: 1.0\r\nname,address,latitude,longitude,documentType,documentNumber,phone,email,segment,visitFrequencyDays,territoryId\r\nExample customer,Example address,-12.0464,-77.0428,,,,,,,\r\n");
        assertThat(csv).doesNotContain("=").doesNotContain("+").doesNotContain("@");
    }

    @Test void adminGetsXlsxWithVersionProperty() throws Exception {
        authenticate(BaseRole.COMPANY_ADMIN);
        byte[] content = mvc.perform(get("/customers/import-template").header("Accept", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(status().isOk()).andExpect(header().string("X-Template-Version", "1.0")).andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).andReturn().getResponse().getContentAsByteArray();
        assertThat(entry(content, "docProps/custom.xml")).contains("TemplateVersion", "1.0");
        assertThat(entry(content, "xl/worksheets/sheet1.xml")).contains("name", "territoryId", "Example customer").doesNotContain("<f>");
    }

    @Test void rejectsUnsupportedAcceptAndUnauthenticatedOrNonAdminWithoutFile() throws Exception {
        mvc.perform(get("/customers/import-template")).andExpect(status().isForbidden()).andExpect(content().contentTypeCompatibleWith("application/problem+json"));
        authenticate(BaseRole.SUPERVISOR);
        mvc.perform(get("/customers/import-template")).andExpect(status().isForbidden()).andExpect(content().contentTypeCompatibleWith("application/problem+json"));
        authenticate(BaseRole.SELLER);
        mvc.perform(get("/customers/import-template")).andExpect(status().isForbidden());
        authenticate(BaseRole.COMPANY_ADMIN);
        mvc.perform(get("/customers/import-template").header("Accept", "application/json")).andExpect(status().isNotAcceptable()).andExpect(content().contentTypeCompatibleWith("application/problem+json"));
        mvc.perform(get("/customers/import-template").header("Accept", "*/*")).andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("text/csv"));
    }

    @Test void excludesZeroQualityTypesAndChoosesHighestPermittedQuality() throws Exception {
        authenticate(BaseRole.COMPANY_ADMIN);
        String xlsx = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        mvc.perform(get("/customers/import-template").header("Accept", "text/csv;q=0, " + xlsx)).andExpect(status().isOk()).andExpect(content().contentType(xlsx));
        mvc.perform(get("/customers/import-template").header("Accept", "text/csv;q=0, " + xlsx + ";q=0")).andExpect(status().isNotAcceptable());
        mvc.perform(get("/customers/import-template").header("Accept", "text/csv;q=0.4, " + xlsx + ";q=0.8")).andExpect(status().isOk()).andExpect(content().contentType(xlsx));
    }

    private static String entry(byte[] bytes, String expected) throws Exception {
        try (var zip = new ZipInputStream(new java.io.ByteArrayInputStream(bytes))) {
            for (var item = zip.getNextEntry(); item != null; item = zip.getNextEntry()) if (expected.equals(item.getName())) return new String(zip.readAllBytes(), StandardCharsets.UTF_8);
        }
        throw new AssertionError("missing " + expected);
    }
    private static void authenticate(BaseRole role) { SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), role), "test", List.of())); }
}
