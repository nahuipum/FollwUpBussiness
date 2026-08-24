package com.nahui.followupbussiness.imports.application.port.in;

public interface DownloadCustomerImportTemplateUseCase {
    Template download(Format format);

    enum Format {CSV, XLSX}

    record Template(String version, String filename, String contentType, byte[] content) {
    }
}
