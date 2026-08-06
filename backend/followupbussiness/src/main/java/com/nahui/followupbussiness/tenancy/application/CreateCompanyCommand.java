package com.nahui.followupbussiness.tenancy.application;

import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import java.util.Objects;

public record CreateCompanyCommand(String legalName, String tradeName, String code, String taxId, CompanySettings settings) {
    public CreateCompanyCommand {
        if (legalName == null || legalName.isBlank() || legalName.length() < 2 || legalName.length() > 200)
            throw new IllegalArgumentException("legalName is invalid");
        if (code == null || !code.matches("[A-Z0-9][A-Z0-9_-]{2,39}")) throw new IllegalArgumentException("code is invalid");
        if (tradeName != null && tradeName.length() > 200) throw new IllegalArgumentException("tradeName is invalid");
        if (taxId != null && taxId.length() > 30) throw new IllegalArgumentException("taxId is invalid");
        Objects.requireNonNull(settings, "settings is required");
    }
}
