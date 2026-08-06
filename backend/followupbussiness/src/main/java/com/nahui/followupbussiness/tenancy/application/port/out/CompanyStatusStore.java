package com.nahui.followupbussiness.tenancy.application.port.out;

import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface CompanyStatusStore {
    Optional<Transition> changeStatus(UUID companyId, CompanyStatus desiredStatus, Instant changedAt);

    record Transition(Company before, Company after, boolean changed) { }
}
