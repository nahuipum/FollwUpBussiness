package com.nahui.followupbussiness.identityaccess.application;

import static org.assertj.core.api.Assertions.*;
import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAuditCommand;
import com.nahui.followupbussiness.audit.application.port.in.RecordPlatformCompanyAuditUseCase;
import com.nahui.followupbussiness.audit.domain.AuditAction;
import com.nahui.followupbussiness.audit.domain.AuditResult;
import com.nahui.followupbussiness.identityaccess.application.port.out.*;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import java.time.*; import java.util.*;
import org.junit.jupiter.api.Test;

class ProvisionInitialCompanyAdminServiceTest {
    UUID company=UUID.randomUUID(); Store store=new Store(); Tokens tokens=new Tokens(); Notices notices=new Notices(); List<RecordPlatformCompanyAuditCommand> audits=new ArrayList<>();
    ProvisionInitialCompanyAdminService service(boolean active) { return new ProvisionInitialCompanyAdminService(store,id->active,tokens,notices,raw->"$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEo",audits::add,Clock.fixed(Instant.EPOCH,ZoneOffset.UTC),"01234567890123456789012345678901".getBytes()); }
    @Test void platformActorCreatesOnlyInvitedCompanyAdminAndActivation() { var result=service(true).execute(new ProvisionInitialCompanyAdminCommand(company," Admin ",null," ADMIN@example.test "),new AuthenticatedActor(UUID.randomUUID(),null,BaseRole.PLATFORM_SUPERADMIN)); assertThat(result.email()).isEqualTo("admin@example.test"); assertThat(store.company).isEqualTo(company); assertThat(store.login).isEqualTo("admin@example.test"); assertThat(tokens.token.purpose()).isEqualTo(PasswordRecoveryPort.Purpose.ACTIVATION); assertThat(notices.token).hasSize(43); assertThat(audits).singleElement().satisfies(a->{assertThat(a.action()).isEqualTo(AuditAction.PROVISION_INITIAL_COMPANY_ADMIN);assertThat(a.result()).isEqualTo(AuditResult.SUCCESS);}); }
    @Test void tenantBoundOrUnauthorizedActorCannotMutate() { var command=new ProvisionInitialCompanyAdminCommand(company,"Admin",null,"a@example.test"); assertThatThrownBy(()->service(true).execute(command,new AuthenticatedActor(UUID.randomUUID(),company,BaseRole.PLATFORM_SUPERADMIN))).isInstanceOf(ProvisionInitialCompanyAdminService.Forbidden.class); assertThatThrownBy(()->service(true).execute(command,new AuthenticatedActor(UUID.randomUUID(),null,BaseRole.SELLER))).isInstanceOf(ProvisionInitialCompanyAdminService.Forbidden.class); assertThat(store.company).isNull(); }
    @Test void inactiveCompanyCannotCreate() { assertThatThrownBy(()->service(false).execute(new ProvisionInitialCompanyAdminCommand(company,"Admin",null,"a@example.test"),new AuthenticatedActor(UUID.randomUUID(),null,BaseRole.PLATFORM_SUPERADMIN))).isInstanceOf(ProvisionInitialCompanyAdminService.CompanyUnavailable.class); assertThat(store.company).isNull(); }
    @Test void duplicateIsConflictWithoutRecordingInsideTheRolledBackTransaction() { store.accept=false; assertThatThrownBy(()->service(true).execute(new ProvisionInitialCompanyAdminCommand(company,"Admin",null,"a@example.test"),new AuthenticatedActor(UUID.randomUUID(),null,BaseRole.PLATFORM_SUPERADMIN))).isInstanceOf(ProvisionInitialCompanyAdminService.Conflict.class); assertThat(tokens.token).isNull(); assertThat(audits).isEmpty(); }
    static final class Store implements InitialCompanyAdminStore { boolean accept=true; UUID company; String login,email,name; UUID id; public boolean create(UUID id,UUID company,String login,String hash,String name,String email){this.id=id;this.company=company;this.login=login;this.name=name;this.email=email;return accept;} public ProvisionInitialCompanyAdminResult created(UUID id){return new ProvisionInitialCompanyAdminResult(id,name,login,email,Instant.EPOCH,Instant.EPOCH);} }
    static final class Tokens implements PasswordRecoveryPort { Token token; public Account findEligibleByIdentifier(String x){return null;} public void replaceToken(Token x){token=x;} public Token consume(byte[] x,Instant n){return null;} public void resetAccount(UUID a,UUID t,String h,boolean x,Instant n){} public void invalidateAccountTokens(UUID a,Instant n){} }
    static final class Notices implements IdentityNotificationPort { String token; public void enqueue(UUID a,UUID t,PasswordRecoveryPort.Purpose p,String i,String token,Instant e){this.token=token;} }
}
