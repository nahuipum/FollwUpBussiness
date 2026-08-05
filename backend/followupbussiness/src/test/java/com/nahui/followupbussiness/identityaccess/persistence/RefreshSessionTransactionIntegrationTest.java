package com.nahui.followupbussiness.identityaccess.persistence;

import com.nahui.followupbussiness.audit.adapter.out.persistence.JdbcAuthenticationAuditAdapter;
import com.nahui.followupbussiness.audit.application.port.in.RecordAuthenticationAuditUseCase;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcLoginAccountQuery;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcRefreshSessionAdapter;
import com.nahui.followupbussiness.identityaccess.application.RefreshService;
import com.nahui.followupbussiness.identityaccess.application.port.out.RefreshRateLimitPort;
import com.nahui.followupbussiness.identityaccess.adapter.out.security.Rs256AccessTokenAdapter;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import static org.assertj.core.api.Assertions.*;

class RefreshSessionTransactionIntegrationTest {
 private static final DockerImageName IMAGE=DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres");
 private static PostgreSQLContainer postgres; private JdbcTemplate jdbc; private TransactionTemplate tx; private UUID account,company,family,client; private final Instant now=Instant.parse("2026-08-04T12:00:00Z"); private final String refresh="A".repeat(43); private static final byte[] KEY="01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);
 @BeforeAll static void start(){postgres=new PostgreSQLContainer(IMAGE).withDatabaseName("be004_refresh").withUsername("be004").withPassword("be004");postgres.start();}
 @AfterAll static void stop(){if(postgres!=null)postgres.stop();}
 @BeforeEach void clean(){var ds=new DriverManagerDataSource(postgres.getJdbcUrl(),postgres.getUsername(),postgres.getPassword());Flyway.configure().dataSource(ds).locations("classpath:db/migration").cleanDisabled(false).load().clean();Flyway.configure().dataSource(ds).locations("classpath:db/migration").load().migrate();jdbc=new JdbcTemplate(ds);tx=new TransactionTemplate(new DataSourceTransactionManager(ds));account=UUID.randomUUID();company=UUID.randomUUID();family=UUID.randomUUID();client=UUID.randomUUID();jdbc.update("INSERT INTO tenancy_company(id,status,created_at,updated_at) VALUES (?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",company);jdbc.update("INSERT INTO identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) VALUES (?,?,?,'SELLER',?,'ACTIVE','User','u@example.test',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",account,"u@example.test","$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoOe",company);jdbc.update("INSERT INTO identity_access_session_family(id,account_id,company_id,channel,client_instance_digest,refresh_token_digest,expires_at,created_at) VALUES (?,?,?,'MOBILE',?,?,?,?)",family,account,company,hmac(client.toString()),hmac(refresh),java.sql.Timestamp.from(now.plusSeconds(2592000)),java.sql.Timestamp.from(now));}
 @Test void concurrentRefreshCreatesOneSuccessorAndOneContractualReplay(){var service=service(new JdbcAuthenticationAuditAdapter(jdbc));var gate=new CountDownLatch(1);UUID correlation=UUID.randomUUID();try(var pool=Executors.newFixedThreadPool(2)){var first=pool.submit(()->call(service,gate,correlation));var second=pool.submit(()->call(service,gate,correlation));gate.countDown();var outcomes=List.of(first.get(),second.get());assertThat(outcomes.stream().filter(x->x.equals("OK")).count()).isEqualTo(1);assertThat(outcomes.stream().filter(x->x.equals("ALREADY_ROTATED")).count()).isEqualTo(1);}catch(Exception e){throw new AssertionError(e);}assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_consumed_refresh_token WHERE family_id=?",Integer.class,family)).isEqualTo(1);assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_entry WHERE resource_id=?",Integer.class,family)).isEqualTo(2);var replay=jdbc.queryForMap("SELECT correlation_id,after_state::text FROM audit_entry WHERE resource_id=? AND after_state->>'result'='ALREADY_ROTATED'",family);assertThat(replay.get("correlation_id")).isEqualTo(correlation);assertThat(replay.get("after_state").toString()).contains("REPLAY").doesNotContain(refresh);}
 @Test void webRefreshRotatesCsrfAndRejectsThePreviousValue(){jdbc.update("UPDATE identity_access_session_family SET channel='WEB',csrf_token_digest=? WHERE id=?",hmac("C0"),family);var service=service(new JdbcAuthenticationAuditAdapter(jdbc));var first=tx.execute(s->service.refresh(command(refresh,"C0",UUID.randomUUID())));var second=tx.execute(s->service.refresh(command(first.refreshToken(),first.csrfToken(),UUID.randomUUID())));assertThat(first.csrfToken()).isNotEqualTo("C0");assertThat(second.csrfToken()).isNotEqualTo(first.csrfToken());assertThatThrownBy(()->tx.execute(s->service.refresh(command(second.refreshToken(),"C0",UUID.randomUUID())))).isInstanceOf(RefreshService.Rejected.class);}
 @Test void auditFailureRollsBackConsumedDigestAndSuccessor(){var service=service(c->{throw new IllegalStateException("audit failure");});assertThatThrownBy(()->tx.execute(s->service.refresh(command()))).isInstanceOf(IllegalStateException.class);assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_consumed_refresh_token WHERE family_id=?",Integer.class,family)).isZero();assertThat(jdbc.queryForObject("SELECT refresh_token_digest FROM identity_access_session_family WHERE id=?",byte[].class,family)).isEqualTo(hmac(refresh));assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_entry WHERE resource_id=?",Integer.class,family)).isZero();}
 private String call(RefreshService s,CountDownLatch gate,UUID correlation)throws Exception{gate.await();try{execute(s,correlation);return "OK";}catch(RefreshService.Rejected e){return e.code.name();}}
 private RefreshService.Result execute(RefreshService service,UUID correlation){Object outcome=tx.execute(status->{try{return service.refresh(command(refresh,null,correlation));}catch(RefreshService.Rejected rejected){return rejected;}});if(outcome instanceof RefreshService.Rejected rejected)throw rejected;return (RefreshService.Result)outcome;}
 private RefreshService service(RecordAuthenticationAuditUseCase audit){try{var keys=KeyPairGenerator.getInstance("RSA");keys.initialize(2048);var port=(RefreshRateLimitPort)(id,ip)->new RefreshRateLimitPort.Decision(true,1);return new RefreshService(new JdbcRefreshSessionAdapter(jdbc),new JdbcLoginAccountQuery(jdbc),id->true,new Rs256AccessTokenAdapter(keys.generateKeyPair().getPrivate(),"kid","issuer","aud",Clock.fixed(now,ZoneOffset.UTC)),audit,port,Clock.fixed(now,ZoneOffset.UTC),KEY);}catch(Exception e){throw new AssertionError(e);}}
 private RefreshService.Command command(){return command(refresh,null,UUID.randomUUID());} private RefreshService.Command command(String token,String csrf,UUID correlation){String channel=csrf==null?"MOBILE":"WEB";return new RefreshService.Command(token,csrf,channel,client,correlation,"127.0.0.1");}
 private static byte[] hmac(String value){try{var m=Mac.getInstance("HmacSHA256");m.init(new SecretKeySpec(KEY,"HmacSHA256"));return m.doFinal(value.getBytes(StandardCharsets.UTF_8));}catch(Exception e){throw new AssertionError(e);}}
}
