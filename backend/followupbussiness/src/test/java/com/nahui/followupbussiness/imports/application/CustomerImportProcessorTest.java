package com.nahui.followupbussiness.imports.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nahui.followupbussiness.customers.application.CheckCustomerDuplicatesService;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.junit.jupiter.api.Test;

class CustomerImportProcessorTest {
    @Test void acceptsXlsxWithRequiredMetadataAndOneWorksheet() throws Exception {
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID();
        CustomerImportStore store = mock(CustomerImportStore.class);
        CustomerImport job = new CustomerImport(importId, tenantId, UUID.randomUUID(), UUID.randomUUID(), "key", "customers.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "1.0", true, "0".repeat(64), CustomerImport.Status.PENDING, 0, 0, Instant.now(), Instant.now(), null, null);
        when(store.claim(importId, tenantId)).thenReturn(Optional.of(new CustomerImportStore.ClaimedImport(job, xlsx(true, false))));
        new CustomerImportProcessor(store, mock(CreateCustomerService.class), mock(CheckCustomerDuplicatesService.class)).process(importId, tenantId);
        verify(store).recordRowErrors(importId, List.of());
        verify(store).complete(importId, 0, 0, false);
    }

    @Test void rejectsXlsxWithoutTemplateVersionMetadata() throws Exception { assertInvalidTemplate(xlsx(false, false)); }
    @Test void rejectsXlsxWithMoreThanOneWorksheet() throws Exception { assertInvalidTemplate(xlsx(true, true)); }

    private static void assertInvalidTemplate(byte[] contents) {
        UUID importId = UUID.randomUUID(), tenantId = UUID.randomUUID();
        CustomerImportStore store = mock(CustomerImportStore.class);
        CustomerImport job = new CustomerImport(importId, tenantId, UUID.randomUUID(), UUID.randomUUID(), "key", "customers.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "1.0", true, "0".repeat(64), CustomerImport.Status.PENDING, 0, 0, Instant.now(), Instant.now(), null, null);
        when(store.claim(importId, tenantId)).thenReturn(Optional.of(new CustomerImportStore.ClaimedImport(job, contents)));
        CreateCustomerService customers = mock(CreateCustomerService.class);
        new CustomerImportProcessor(store, customers, mock(CheckCustomerDuplicatesService.class)).process(importId, tenantId);
        verify(store).recordRowErrors(eq(importId), eq(List.of(new CustomerImportStore.RowError(1, "INVALID_TEMPLATE"))));
        verify(store).complete(importId, 0, 1, true);
        verify(customers, never()).create(any(), any());
    }

    private static byte[] xlsx(boolean templateVersion, boolean extraSheet) throws Exception {
        String headers = "<row r=\"1\"><c><is><t>name</t></is></c><c><is><t>address</t></is></c><c><is><t>latitude</t></is></c><c><is><t>longitude</t></is></c><c><is><t>documentType</t></is></c><c><is><t>documentNumber</t></is></c><c><is><t>phone</t></is></c><c><is><t>email</t></is></c><c><is><t>segment</t></is></c><c><is><t>visitFrequencyDays</t></is></c><c><is><t>territoryId</t></is></c></row>";
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream(); ZipOutputStream zip = new ZipOutputStream(bytes)) {
            entry(zip, "xl/worksheets/sheet1.xml", "<worksheet><sheetData>" + headers + "</sheetData></worksheet>");
            if (extraSheet) entry(zip, "xl/worksheets/sheet2.xml", "<worksheet><sheetData/></worksheet>");
            if (templateVersion) entry(zip, "docProps/custom.xml", "<Properties><property name=\"TemplateVersion\"><value>1.0</value></property></Properties>");
            zip.finish();
            return bytes.toByteArray();
        }
    }

    private static void entry(ZipOutputStream zip, String name, String value) throws Exception { zip.putNextEntry(new ZipEntry(name)); zip.write(value.getBytes(StandardCharsets.UTF_8)); zip.closeEntry(); }
}
