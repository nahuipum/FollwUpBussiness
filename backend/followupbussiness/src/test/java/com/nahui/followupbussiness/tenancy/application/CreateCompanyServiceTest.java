package com.nahui.followupbussiness.tenancy.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAuditCommand;
import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAuditCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyCreationStore;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CreateCompanyServiceTest {
    private final AuthenticatedActor platform = new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN);
    private final CreateCompanyCommand command = new CreateCompanyCommand("Nahui SAC", null, "NAHUI", null,
            new CompanySettings("America/Lima", "PEN", 100, 60, 90, null));

    @Test void createsActiveCompanyAndAuditsTheServerGeneratedResource() {
        CapturingStore store = new CapturingStore(true); CapturingAudit audit = new CapturingAudit();
        var result = service(store, audit, new CapturingDenialAudit()).execute(command, platform);
        assertThat(result.conflict()).isFalse(); assertThat(result.company().status().name()).isEqualTo("ACTIVE");
        assertThat(store.company.id()).isEqualTo(audit.command.resourceId());
        assertThat(audit.command.result().name()).isEqualTo("SUCCESS");
    }
    @Test void recordsTenantBoundRejectionWithoutWritingCompany() {
        CapturingStore store = new CapturingStore(true); CapturingAudit audit = new CapturingAudit(); CapturingDenialAudit denial = new CapturingDenialAudit();
        var result = service(store, audit, denial).execute(command,
                new AuthenticatedActor(UUID.randomUUID(), UUID.randomUUID(), BaseRole.PLATFORM_SUPERADMIN));
        assertThat(store.company).isNull();
        assertThat(result.denied()).isTrue();
        assertThat(audit.command).isNull();
        assertThat(denial.command.attemptId()).isNotNull();
    }
    @Test void recordsConflictWithoutCreatingASecondCompany() {
        CapturingAudit audit = new CapturingAudit();
        var result = service(new CapturingStore(false), audit, new CapturingDenialAudit()).execute(command, platform);
        assertThat(result.conflict()).isTrue(); assertThat(audit.command.result().name()).isEqualTo("ERROR");
    }
    @Test void rejectsAnyMvpSettingThatWouldWeakenTrackingOrRetention() {
        assertThatThrownBy(() -> new CompanySettings("America/Lima", "PEN", 99, 60, 90, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new CompanySettings("America/Lima", "PEN", 100, 61, 90, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new CompanySettings("America/Lima", "PEN", 100, 60, 89, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new CompanySettings("Invalid/Timezone", "PEN", 100, 60, 90, null)).isInstanceOf(IllegalArgumentException.class);
    }
    private static CreateCompanyService service(CompanyCreationStore store, RecordPlatformCompanyAuditUseCase audit, RecordCompanyDenialAuditUseCase denialAudit) {
        return new CreateCompanyService(store, audit, denialAudit, Clock.fixed(Instant.parse("2026-08-05T00:00:00Z"), ZoneOffset.UTC));
    }
    private static final class CapturingStore implements CompanyCreationStore { final boolean created; Company company; CapturingStore(boolean created){this.created=created;} public boolean create(Company c){company=c; return created;} }
    private static final class CapturingAudit implements RecordPlatformCompanyAuditUseCase { RecordPlatformCompanyAuditCommand command; public void record(RecordPlatformCompanyAuditCommand c){command=c;} }
    private static final class CapturingDenialAudit implements RecordCompanyDenialAuditUseCase { RecordCompanyDenialAuditCommand command; public void record(RecordCompanyDenialAuditCommand c){command=c;} }
}
