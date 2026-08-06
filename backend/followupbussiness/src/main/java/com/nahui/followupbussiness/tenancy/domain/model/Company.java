package com.nahui.followupbussiness.tenancy.domain.model;

import java.time.Instant;
import java.util.UUID;

public record Company(UUID id, String legalName, String tradeName, String code, String taxId, CompanyStatus status,
                      CompanySettings settings, Instant createdAt, Instant updatedAt, long version) { }
