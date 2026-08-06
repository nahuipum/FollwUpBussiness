package com.nahui.followupbussiness.tenancy.application;

import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.util.Objects;

public record ChangeCompanyStatusCommand(CompanyStatus status, String reason) {
    public ChangeCompanyStatusCommand {
        Objects.requireNonNull(status, "status is required");
        reason = reason == null ? null : reason.replaceAll("[\\p{Cntrl}]", " ").replaceAll("\\s+", " ").trim();
        if (reason == null || reason.length() < 5 || reason.length() > 500) {
            throw new IllegalArgumentException("reason must contain between 5 and 500 characters");
        }
    }
}
