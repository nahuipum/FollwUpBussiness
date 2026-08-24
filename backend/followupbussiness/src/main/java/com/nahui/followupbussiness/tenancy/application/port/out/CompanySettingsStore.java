package com.nahui.followupbussiness.tenancy.application.port.out;

import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface CompanySettingsStore {
    Optional<Company> findActiveByTenantId(UUID tenantId);

    Optional<Company> update(UUID tenantId, CompanySettings settings, long expectedVersion, Instant updatedAt);
}
