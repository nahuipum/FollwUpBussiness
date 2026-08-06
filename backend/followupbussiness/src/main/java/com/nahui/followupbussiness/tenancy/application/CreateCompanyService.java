package com.nahui.followupbussiness.tenancy.application;

import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAuditCommand;
import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAuditCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordCompanyDenialAuditUseCase;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.CreateCompanyUseCase;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyCreationStore;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

public final class CreateCompanyService implements CreateCompanyUseCase {
    private final CompanyCreationStore store;
    private final RecordPlatformCompanyAuditUseCase audit;
    private final RecordCompanyDenialAuditUseCase denialAudit;
    private final Clock clock;
    public CreateCompanyService(CompanyCreationStore store, RecordPlatformCompanyAuditUseCase audit,
            RecordCompanyDenialAuditUseCase denialAudit, Clock clock) {
        this.store = store; this.audit = audit; this.denialAudit = denialAudit; this.clock = clock;
    }
    @Override public Result execute(CreateCompanyCommand command, AuthenticatedActor actor) {
        if (actor == null || actor.role() != BaseRole.PLATFORM_SUPERADMIN)
            throw new AccessDeniedException();
        if (actor.tenantId() != null) {
            denialAudit.record(new RecordCompanyDenialAuditCommand(UUID.randomUUID()));
            return Result.deniedResult();
        }
        Instant now = clock.instant(); UUID id = UUID.randomUUID();
        Company company = new Company(id, command.legalName(), command.tradeName(), command.code(), command.taxId(), CompanyStatus.ACTIVE,
                command.settings(), now, now, 1);
        if (!store.create(company)) {
            audit.record(new RecordPlatformCompanyAuditCommand(id, AuditResult.ERROR));
            return Result.conflictResult();
        }
        audit.record(new RecordPlatformCompanyAuditCommand(id, AuditResult.SUCCESS));
        return Result.created(company);
    }
    public static final class AccessDeniedException extends RuntimeException { }
}
