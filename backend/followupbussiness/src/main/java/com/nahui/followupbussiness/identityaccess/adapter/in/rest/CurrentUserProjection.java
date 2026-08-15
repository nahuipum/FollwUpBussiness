package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.port.out.LoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.RoleScope;
import com.nahui.followupbussiness.tenancy.application.port.in.CurrentCompanyQuery;
import com.nahui.followupbussiness.tenancy.domain.model.Company;

import java.time.Instant;
import java.util.List;

public final class CurrentUserProjection {
    private final LoginAccountQuery accounts;
    private final CurrentCompanyQuery companies;

    public CurrentUserProjection(LoginAccountQuery accounts, CurrentCompanyQuery companies) {
        this.accounts = accounts;
        this.companies = companies;
    }

    CurrentUser from(LoginAccountQuery.Account account) {
        CompanyResponse company = account.role().scope() == RoleScope.PLATFORM ? null
                : companies.findById(account.companyId()).map(CompanyResponse::from).orElseThrow(Unauthenticated::new);
        if (account.role().scope() == RoleScope.PLATFORM && account.companyId() != null) throw new Unauthenticated();
        if (account.role().scope() != RoleScope.PLATFORM && account.companyId() == null) throw new Unauthenticated();
        return new CurrentUser(account.id(), account.displayName(), account.email(), account.status(), List.of(account.role().code()), company);
    }

    CurrentUser from(AuthenticatedActor actor) {
        var account = accounts.findById(actor.accountId()).orElseThrow(Unauthenticated::new);
        if (account.role() != actor.role() || !java.util.Objects.equals(account.companyId(), actor.tenantId())
                || !"ACTIVE".equals(account.status())) throw new Unauthenticated();
        return from(account);
    }

    record CurrentUser(java.util.UUID id, String displayName, String email, String status, List<String> roles,
                       CompanyResponse company) {
    }

    record CompanyResponse(java.util.UUID id, String legalName, String tradeName, String code, String taxId,
                           String status, SettingsResponse settings, Instant createdAt, Instant updatedAt,
                           long version) {
        static CompanyResponse from(Company company) {
            var s = company.settings();
            return new CompanyResponse(company.id(), company.legalName(), company.tradeName(), company.code(), company.taxId(),
                    company.status().name(), new SettingsResponse(s.timezone(), s.currency(), s.geofenceRadiusMeters(),
                    s.trackingIntervalSeconds(), s.locationRetentionDays(), s.saleEditWindowMinutes()), company.createdAt(),
                    company.updatedAt(), company.version());
        }
    }

    record SettingsResponse(String timezone, String currency, int geofenceRadiusMeters, int trackingIntervalSeconds,
                            int locationRetentionDays, Integer saleEditWindowMinutes) {
    }

    static final class Unauthenticated extends RuntimeException {
    }
}
