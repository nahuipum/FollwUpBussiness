package com.nahui.followupbussiness.tenancy.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAuditCommand;
import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAuditCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyStatusStore;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ChangeCompanyStatusServiceTest {
    private static final Instant NOW = Instant.parse("2026-08-06T12:00:00Z");
    private final UUID companyId = UUID.randomUUID();
    private final AuthenticatedActor platform = new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN);

    @Test void transitionsAuditOnlyReasonPresenceForAnyCallerSuppliedText() {
        for (String reason : java.util.List.of("Operational review", "admin@example.test", "token=opaque-value", "Bearer token-value", "api_key=demo-secret", "arbitrary free text")) {
            Store candidateStore = new Store(company(CompanyStatus.ACTIVE));
            CapturingAudit candidateAudit = new CapturingAudit();
            var result = service(candidateStore, candidateAudit, command -> { }).execute(companyId,
                    new ChangeCompanyStatusCommand(CompanyStatus.SUSPENDED, reason), platform);
            assertThat(result.company().status()).isEqualTo(CompanyStatus.SUSPENDED);
            assertThat(candidateAudit.command.before()).containsEntry("status", "ACTIVE");
            assertThat(candidateAudit.command.after()).containsEntry("status", "SUSPENDED");
            assertThat(candidateAudit.command.reason()).isEqualTo(ChangeCompanyStatusService.REASON_PROVIDED).isNotEqualTo(reason);
        }
    }

    @Test void sameStatusIsA200ResultWithoutWriteOrChangeAudit() {
        Store store = new Store(company(CompanyStatus.ACTIVE));
        CapturingAudit audit = new CapturingAudit();
        var result = service(store, audit, command -> { }).execute(companyId,
                new ChangeCompanyStatusCommand(CompanyStatus.ACTIVE, "Routine review"), platform);
        assertThat(result.company().status()).isEqualTo(CompanyStatus.ACTIVE);
        assertThat(store.writes).isZero();
        assertThat(audit.command).isNull();
    }

    @Test void reactivatesASuspendedCompanyWithTheInverseAuditedTransition() {
        Store store = new Store(company(CompanyStatus.SUSPENDED));
        CapturingAudit audit = new CapturingAudit();
        var result = service(store, audit, command -> { }).execute(companyId,
                new ChangeCompanyStatusCommand(CompanyStatus.ACTIVE, "Suspension resolved"), platform);
        assertThat(result.company().status()).isEqualTo(CompanyStatus.ACTIVE);
        assertThat(audit.command.before()).containsEntry("status", "SUSPENDED");
        assertThat(audit.command.after()).containsEntry("status", "ACTIVE");
    }

    @Test void tenantBoundActorIsDeniedAndAuditedWithoutTouchingCompany() {
        Store store = new Store(company(CompanyStatus.ACTIVE));
        CapturingDenial denial = new CapturingDenial();
        var actor = new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.COMPANY_ADMIN);
        var result = service(store, command -> { }, denial).execute(companyId,
                new ChangeCompanyStatusCommand(CompanyStatus.SUSPENDED, "Policy breach"), actor);
        assertThat(result.denied()).isTrue();
        assertThat(store.calls).isZero();
        assertThat(denial.command.resourceId()).isEqualTo(companyId);
    }

    private ChangeCompanyStatusService service(CompanyStatusStore store, RecordPlatformCompanyAuditUseCase audit,
            RecordCompanyDenialAuditUseCase denial) {
        return new ChangeCompanyStatusService(store, audit, denial, Clock.fixed(NOW, ZoneOffset.UTC));
    }
    private Company company(CompanyStatus status) {
        return new Company(companyId, "Nahui SAC", null, "NAHUI", null, status,
                new CompanySettings("America/Lima", "PEN", 100, 60, 90, null), NOW.minusSeconds(60), NOW.minusSeconds(60), 1);
    }
    private static final class Store implements CompanyStatusStore {
        private Company company; int calls; int writes;
        private Store(Company company) { this.company = company; }
        @Override public Optional<Transition> changeStatus(UUID id, CompanyStatus desired, Instant changedAt) {
            calls++;
            if (company.status() == desired) return Optional.of(new Transition(company, company, false));
            Company after = new Company(company.id(), company.legalName(), company.tradeName(), company.code(), company.taxId(), desired,
                    company.settings(), company.createdAt(), changedAt, company.version() + 1);
            writes++; return Optional.of(new Transition(company, after, true));
        }
    }
    private static final class CapturingAudit implements RecordPlatformCompanyAuditUseCase {
        RecordPlatformCompanyAuditCommand command;
        @Override public void record(RecordPlatformCompanyAuditCommand command) { this.command = command; }
    }
    private static final class CapturingDenial implements RecordCompanyDenialAuditUseCase {
        RecordCompanyDenialAuditCommand command;
        @Override public void record(RecordCompanyDenialAuditCommand command) { this.command = command; }
    }
}
