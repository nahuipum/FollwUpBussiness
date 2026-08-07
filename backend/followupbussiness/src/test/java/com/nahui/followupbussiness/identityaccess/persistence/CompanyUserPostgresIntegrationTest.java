package com.nahui.followupbussiness.identityaccess.persistence;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.*;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryService;
import com.nahui.followupbussiness.identityaccess.adapter.in.rest.CompanyUserController;
import com.nahui.followupbussiness.identityaccess.config.AuthenticationProperties;
import com.nahui.followupbussiness.identityaccess.config.LoginConfiguration;
import com.nahui.followupbussiness.identityaccess.application.port.out.*;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class CompanyUserPostgresIntegrationTest {
    static PostgreSQLContainer postgres; DriverManagerDataSource ds; JdbcTemplate jdbc; TransactionTemplate tx; UUID tenant, other; AuthenticatedActor admin;
    static final byte[] HMAC = "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);
    @BeforeAll static void start(){ postgres=new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres")); postgres.start(); }
    @AfterAll static void stop(){ postgres.stop(); }
    @BeforeEach void migrate(){ ds=new DriverManagerDataSource(postgres.getJdbcUrl(),postgres.getUsername(),postgres.getPassword()); var flyway=Flyway.configure().dataSource(ds).locations("classpath:db/migration").cleanDisabled(false).load(); flyway.clean(); flyway.migrate(); jdbc=new JdbcTemplate(ds); tx=new TransactionTemplate(new DataSourceTransactionManager(ds)); tenant=company(); other=company(); admin=new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.COMPANY_ADMIN); }

    @Test void tenantScopedIdentityPagingAndOptimisticVersionAreDurable(){
        UUID a=account(tenant,"same","same@example.test",BaseRole.SUPERVISOR,"ACTIVE"), b=account(other,"same","same@example.test",BaseRole.SUPERVISOR,"ACTIVE");
        assertThat(service(jdbc,jdbcAudit(),jdbcOutbox()).list(0,1,"same",BaseRole.SUPERVISOR,"ACTIVE",admin).items()).extracting(CompanyUserService.User::id).containsExactly(a);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_account WHERE login_identifier='same'",Integer.class)).isEqualTo(2);
        var s=service(jdbc,jdbcAudit(),jdbcOutbox()); tx.executeWithoutResult(x -> s.update(a,new CompanyUserService.Update("Changed","same","same@example.test",BaseRole.SUPERVISOR,0),admin));
        assertThatThrownBy(()->tx.executeWithoutResult(x -> s.update(a,new CompanyUserService.Update("Again","same","same@example.test",BaseRole.SUPERVISOR,0),admin))).isInstanceOf(CompanyUserService.Conflict.class);
        assertThat(jdbc.queryForObject("SELECT credential_version FROM identity_access_account WHERE id=?",Long.class,a)).isEqualTo(1L);
    }
    @Test void sameTenantNormalizedIdentityConflictLeavesOnlyOriginalDurableIdentity(){
        var s=inviteService();
        var first=tx.execute(x->s.invite(new CompanyUserService.Invite("First identity"," Same "," Same@Example.test ",BaseRole.SUPERVISOR),admin));

        assertThatThrownBy(()->tx.executeWithoutResult(x->s.invite(new CompanyUserService.Invite("Second identity","  SAME  ","same@example.TEST",BaseRole.SUPERVISOR),admin))).isInstanceOf(CompanyUserService.Conflict.class);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_account WHERE company_id=?",Integer.class,tenant)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT display_name||'|'||login_identifier||'|'||email||'|'||status FROM identity_access_account WHERE id=?",String.class,first.id())).isEqualTo("First identity|same|same@example.test|INVITED");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_action_token WHERE company_id=?",Integer.class,tenant)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_notification WHERE company_id=?",Integer.class,tenant)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE tenant_id=? AND resource_type='COMPANY_USER' AND result='SUCCESS'",Integer.class,tenant)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM transactional_outbox WHERE tenant_id=? AND causation_id=?",Integer.class,tenant,first.id())).isEqualTo(1);
    }
    @Test void concurrentLastAdminRemovalConfirmsAtMostOne() throws Exception {
        UUID one=account(tenant,"one","one@example.test",BaseRole.COMPANY_ADMIN,"ACTIVE"), two=account(tenant,"two","two@example.test",BaseRole.COMPANY_ADMIN,"ACTIVE"); var s=service(jdbc,jdbcAudit(),jdbcOutbox());
        try(var pool=Executors.newFixedThreadPool(2)){var gate=new CountDownLatch(1); var f1=pool.submit(()->attempt(gate,s,one)); var f2=pool.submit(()->attempt(gate,s,two)); gate.countDown(); assertThat(List.of(f1.get(),f2.get())).containsExactlyInAnyOrder(true,false);}
        assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_account WHERE company_id=? AND role_code='COMPANY_ADMIN' AND status='ACTIVE'",Integer.class,tenant)).isEqualTo(1);
    }
    @Test void concurrentActivationReplayConfirmsExactlyOne() throws Exception {
        UUID invited=account(tenant,"invite","invite@example.test",BaseRole.SUPERVISOR,"INVITED"); String token="A".repeat(43); jdbc.update("INSERT INTO identity_access_action_token(id,account_id,company_id,purpose,token_digest,expires_at,created_at) VALUES(?,?,?,'ACTIVATION',?,?,CURRENT_TIMESTAMP)",UUID.randomUUID(),invited,tenant,digest(token),Timestamp.from(Instant.now().plusSeconds(3600)));
        var recovery=new JdbcPasswordRecoveryAdapter(jdbc); var activation=new PasswordRecoveryService(recovery,mock(PasswordRecoveryRequestPort.class),(a,t,p,i,k,e)->{},new JdbcRefreshSessionAdapter(jdbc),p->"$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoAA",Clock.systemUTC(),HMAC);
        try(var pool=Executors.newFixedThreadPool(2)){var gate=new CountDownLatch(1); var f1=pool.submit(()->activate(gate,activation,token));var f2=pool.submit(()->activate(gate,activation,token));gate.countDown();assertThat(List.of(f1.get(),f2.get())).containsExactlyInAnyOrder(true,false);}
        assertThat(jdbc.queryForObject("SELECT status FROM identity_access_account WHERE id=?",String.class,invited)).isEqualTo("ACTIVE"); assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_action_token WHERE account_id=? AND used_at IS NOT NULL",Integer.class,invited)).isEqualTo(1);
    }
    @Test void auditOutboxAndRevocationFailureRollbackAllDurableWrites(){
        UUID auditUser=rollbackUser("rollback-audit"), outboxUser=rollbackUser("rollback-outbox"), revocationUser=rollbackUser("rollback-revocation");
        var failingAudit=mock(com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore.class); when(failingAudit.append(any())).thenThrow(new IllegalStateException("audit"));
        var failingOutbox=mock(com.nahui.followupbussiness.outbox.application.port.out.OutboxStore.class); doThrow(new IllegalStateException("outbox")).when(failingOutbox).append(any());
        assertRollback(auditUser, service(jdbc,failingAudit,jdbcOutbox()));
        assertRollback(outboxUser, service(jdbc,jdbcAudit(),failingOutbox));
        JdbcTemplate revokeFails=new JdbcTemplate(ds){ @Override public int update(String sql,Object... args){if(sql.startsWith("UPDATE identity_access_session_family"))throw new IllegalStateException("revoke");return super.update(sql,args);} };
        assertRollback(revocationUser,service(revokeFails,jdbcAudit(),jdbcOutbox()));
    }
    @ParameterizedTest @MethodSource("invalidCompanyUserFields")
    void invalidInvitationAndUpdateFieldsAreRejectedBeforeAllDurableSideEffects(String name, String username, String email) {
        var controller = new CompanyUserController(configuredService());
        assertThat(controller.invite(new CompanyUserController.InviteRequest(name, username, email, BaseRole.SUPERVISOR), admin, request()).getStatusCode().value()).isEqualTo(400);
        UUID existing = account(tenant,"valid-user","valid@example.test",BaseRole.SUPERVISOR,"ACTIVE");
        assertThat(controller.update(existing,"0",new CompanyUserController.UpdateRequest(name,username,email,BaseRole.SUPERVISOR),admin,request()).getStatusCode().value()).isEqualTo(400);
        assertThat(jdbc.queryForObject("SELECT credential_version FROM identity_access_account WHERE id=?",Long.class,existing)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE tenant_id=? AND result='SUCCESS'",Integer.class,tenant)).isZero();
        assertNoCompanyUserDurableSideEffects();
    }
    static java.util.stream.Stream<org.junit.jupiter.params.provider.Arguments> invalidCompanyUserFields() {
        return java.util.stream.Stream.of(
                org.junit.jupiter.params.provider.Arguments.of("Valid Name",null,"bad\r@example.test"),
                org.junit.jupiter.params.provider.Arguments.of("Valid Name",null,"bad\n@example.test"),
                org.junit.jupiter.params.provider.Arguments.of("Valid Name",null,"valid@example.test\r"),
                org.junit.jupiter.params.provider.Arguments.of("Valid Name",null,"valid@example.test\n"),
                org.junit.jupiter.params.provider.Arguments.of("Valid Name",null,"\rvalid@example.test"),
                org.junit.jupiter.params.provider.Arguments.of("Valid Name",null,"valid@exa\nmple.test"),
                org.junit.jupiter.params.provider.Arguments.of("Valid Name",null,"not-an-email"),
                org.junit.jupiter.params.provider.Arguments.of("Valid Name",null,"a".repeat(245)+"@example.test"),
                org.junit.jupiter.params.provider.Arguments.of("A",null,"valid@example.test"),
                org.junit.jupiter.params.provider.Arguments.of("A".repeat(161),null,"valid@example.test"),
                org.junit.jupiter.params.provider.Arguments.of("Valid Name","ab","valid@example.test"),
                org.junit.jupiter.params.provider.Arguments.of("Valid Name","a".repeat(101),"valid@example.test"));
    }
    @Test void roleAndCrossTenantDenialsPersistOnlyRedactedCorrelatedDeniedAudit() {
        var controller = new CompanyUserController(configuredService()); UUID target=account(other,"other","other@example.test",BaseRole.SUPERVISOR,"ACTIVE");
        UUID sellerCorrelation=UUID.randomUUID(), platformCorrelation=UUID.randomUUID(), crossCorrelation=UUID.randomUUID();
        assertThat(controller.get(target,new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.SELLER),request(sellerCorrelation)).getStatusCode().value()).isEqualTo(403);
        assertThat(controller.get(target,new AuthenticatedActor(UUID.randomUUID(),tenant,BaseRole.PLATFORM_SUPERADMIN),request(platformCorrelation)).getStatusCode().value()).isEqualTo(403);
        assertThat(controller.get(target,admin,request(crossCorrelation)).getStatusCode().value()).isEqualTo(404);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE result='DENIED' AND resource_id=?",Integer.class,target)).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE result='DENIED' AND correlation_id IN (?,?,?)",Integer.class,sellerCorrelation,platformCorrelation,crossCorrelation)).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE result='SUCCESS'",Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE result='DENIED' AND (before_state::text LIKE '%@%' OR after_state::text LIKE '%@%' OR before_state::text LIKE '%other%' OR after_state::text LIKE '%other%')",Integer.class)).isZero();
        assertNoCompanyUserDurableSideEffects();
    }
    private boolean attempt(CountDownLatch gate,CompanyUserService s,UUID id)throws Exception {gate.await();try{tx.executeWithoutResult(x->s.status(id,"INACTIVE",admin));return true;}catch(CompanyUserService.Conflict e){return false;}}
    private boolean activate(CountDownLatch gate,PasswordRecoveryService s,String token)throws Exception {gate.await();try{tx.executeWithoutResult(x->s.reset(token,"Valid123".toCharArray()));return true;}catch(PasswordRecoveryService.Rejected e){return false;}}
    private void assertRollback(UUID user,CompanyUserService s){
        UUID token=actionToken(user); UUID session=family(user);
        assertThatThrownBy(()->tx.executeWithoutResult(x->s.status(user,"LOCKED",admin))).isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.queryForObject("SELECT invalidated_at FROM identity_access_action_token WHERE id=?",Timestamp.class,token)).isNull();
        assertThat(jdbc.queryForObject("SELECT status FROM identity_access_account WHERE id=?",String.class,user)).isEqualTo("ACTIVE");
        assertThat(jdbc.queryForObject("SELECT revoked_at FROM identity_access_session_family WHERE id=?",Timestamp.class,session)).isNull();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE resource_id=?",Integer.class,user)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM transactional_outbox WHERE causation_id=?",Integer.class,user)).isZero();
    }
    private CompanyUserService service(JdbcTemplate j,com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore audit,com.nahui.followupbussiness.outbox.application.port.out.OutboxStore outbox){return new CompanyUserService(j,Clock.systemUTC(),null,null,audit,outbox,HMAC);}
    private CompanyUserService inviteService(){return new CompanyUserService(jdbc,Clock.systemUTC(),new JdbcPasswordRecoveryAdapter(jdbc),new JdbcIdentityNotificationAdapter(jdbc,HMAC),jdbcAudit(),jdbcOutbox(),HMAC);}
    private CompanyUserService configuredService(){ AuthenticationProperties.Values properties=new AuthenticationProperties.Values(); properties.setHmacSecret(new String(HMAC,StandardCharsets.UTF_8)); return new LoginConfiguration().companyUserService(jdbc,properties); }
    private MockHttpServletRequest request(){ return request(UUID.randomUUID()); }
    private MockHttpServletRequest request(UUID correlation){ MockHttpServletRequest request=new MockHttpServletRequest(); request.addHeader("X-Correlation-Id",correlation.toString()); return request; }
    private void assertNoCompanyUserDurableSideEffects(){ assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_account WHERE company_id=?",Integer.class,tenant)).isLessThanOrEqualTo(1); assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_action_token WHERE company_id=?",Integer.class,tenant)).isZero(); assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_notification WHERE company_id=?",Integer.class,tenant)).isZero(); assertThat(jdbc.queryForObject("SELECT count(*) FROM identity_access_session_family WHERE company_id=?",Integer.class,tenant)).isZero(); assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_entry WHERE tenant_id=? AND result='SUCCESS'",Integer.class,tenant)).isZero(); assertThat(jdbc.queryForObject("SELECT count(*) FROM transactional_outbox WHERE tenant_id=?",Integer.class,tenant)).isZero(); }
    private com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore jdbcAudit(){return new JdbcCompanyUserAuditStore(jdbc);}
    private com.nahui.followupbussiness.outbox.application.port.out.OutboxStore jdbcOutbox(){return new JdbcCompanyUserOutboxStore(jdbc);}
    private UUID company(){UUID id=UUID.randomUUID();jdbc.update("INSERT INTO tenancy_company(id,status,created_at,updated_at) VALUES (?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",id);return id;}
    private UUID account(UUID company,String login,String email,BaseRole role,String status){UUID id=UUID.randomUUID();jdbc.update("INSERT INTO identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) VALUES(?,?,? ,?,?,?, ?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",id,login,"$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoAA",role.code(),company,status,login,email);return id;}
    private UUID family(UUID account){UUID id=UUID.randomUUID();jdbc.update("INSERT INTO identity_access_session_family(id,account_id,company_id,channel,client_instance_digest,refresh_token_digest,expires_at,created_at) VALUES(?,?,?,'WEB',?,?,CURRENT_TIMESTAMP + INTERVAL '1 day',CURRENT_TIMESTAMP)",id,account,tenant,digest("client-"+id),digest("refresh-"+id));return id;}
    private UUID rollbackUser(String login){return account(tenant,login,login+"@example.test",BaseRole.SUPERVISOR,"ACTIVE");}
    private UUID actionToken(UUID account){UUID id=UUID.randomUUID();jdbc.update("INSERT INTO identity_access_action_token(id,account_id,company_id,purpose,token_digest,expires_at,created_at) VALUES(?,?,?,'ACTIVATION',?,?,CURRENT_TIMESTAMP)",id,account,tenant,digest("token-"+id),Timestamp.from(Instant.now().plusSeconds(3600)));return id;}
    private static byte[] digest(String v){try{var m=Mac.getInstance("HmacSHA256");m.init(new SecretKeySpec(HMAC,"HmacSHA256"));return m.doFinal(v.getBytes(StandardCharsets.UTF_8));}catch(Exception e){throw new AssertionError(e);}}
}
