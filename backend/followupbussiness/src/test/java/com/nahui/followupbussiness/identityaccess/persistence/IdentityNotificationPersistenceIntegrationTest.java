package com.nahui.followupbussiness.identityaccess.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcIdentityNotificationAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcPasswordRecoveryAdapter;
import com.nahui.followupbussiness.identityaccess.adapter.out.persistence.JdbcPasswordRecoveryRequestAdapter;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryPort;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

class IdentityNotificationPersistenceIntegrationTest {
    private static final DockerImageName IMAGE=DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres");
    private static PostgreSQLContainer postgres; private JdbcTemplate jdbc; private UUID tenant, account; private final Instant now=Instant.parse("2026-08-06T00:00:00Z");
    @BeforeAll static void start(){postgres=new PostgreSQLContainer(IMAGE).withDatabaseName("be006_notifications").withUsername("be006").withPassword("be006");postgres.start();}
    @AfterAll static void stop(){if(postgres!=null)postgres.stop();}
    @BeforeEach void reset(){var ds=new DriverManagerDataSource(postgres.getJdbcUrl(),postgres.getUsername(),postgres.getPassword());Flyway.configure().dataSource(ds).locations("classpath:db/migration").cleanDisabled(false).load().clean();Flyway.configure().dataSource(ds).locations("classpath:db/migration").load().migrate();jdbc=new JdbcTemplate(ds);tenant=UUID.randomUUID();account=UUID.randomUUID();jdbc.update("INSERT INTO tenancy_company(id,status,created_at,updated_at) VALUES (?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",tenant);jdbc.update("INSERT INTO identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) VALUES (?,?,?,'SELLER',?,'ACTIVE','User','u@example.test',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",account,"u@example.test","$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoOe",tenant);}
    @Test void enqueueBindsPayloadDigestAndClaimDeliveryErasesOnlyOwnTenant(){var adapter=new JdbcIdentityNotificationAdapter(jdbc,"01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));var instant=Instant.now();adapter.enqueue(account,tenant,PasswordRecoveryPort.Purpose.PASSWORD_RESET,"u@example.test","A".repeat(43),instant.plusSeconds(60));assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_notification",Integer.class)).isEqualTo(1);var work=adapter.claimDue(instant.plusSeconds(1),1).getFirst();assertThat(work.delivery().identifier()).isEqualTo("u@example.test");adapter.delivered(work.id(),tenant,instant);assertThat(jdbc.queryForObject("SELECT delivered_at IS NOT NULL AND octet_length(payload_ciphertext)=0 FROM identity_access_notification WHERE id=?",Boolean.class,work.id())).isTrue();}
    @Test void platformAccountTransitionsAcknowledgeRetryAndCryptoEraseWithoutRedelivery(){
        var adapter=new JdbcIdentityNotificationAdapter(jdbc,"01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));
        var platformAccount=UUID.randomUUID();
        var instant=Instant.now();
        jdbc.update("INSERT INTO identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) VALUES (?,?,?,'PLATFORM_SUPERADMIN',NULL,'ACTIVE','Platform','platform@example.test',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",platformAccount,"platform@example.test","$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoOe");
        adapter.enqueue(platformAccount,null,PasswordRecoveryPort.Purpose.PASSWORD_RESET,"platform@example.test","A".repeat(43),instant.plusSeconds(300));
        var acknowledged=adapter.claimDue(instant.plusSeconds(1),1).getFirst();
        adapter.delivered(acknowledged.id(),null,instant.plusSeconds(2));
        assertThat(jdbc.queryForObject("SELECT delivered_at IS NOT NULL AND octet_length(payload_ciphertext)=0 FROM identity_access_notification WHERE id=?",Boolean.class,acknowledged.id())).isTrue();
        adapter.enqueue(platformAccount,null,PasswordRecoveryPort.Purpose.PASSWORD_RESET,"platform@example.test","B".repeat(43),instant.plusSeconds(300));
        var retried=adapter.claimDue(instant.plusSeconds(3),1).getFirst();
        var nextAttempt=instant.plusSeconds(20);
        adapter.retry(retried.id(),null,nextAttempt);
        assertThat(jdbc.queryForObject("SELECT attempt_count=1 AND next_attempt_at=? FROM identity_access_notification WHERE id=?",Boolean.class,java.sql.Timestamp.from(nextAttempt),retried.id())).isTrue();
        adapter.erase(retried.id(),null,instant.plusSeconds(4));
        assertThat(jdbc.queryForObject("SELECT superseded_at IS NOT NULL AND octet_length(payload_ciphertext)=0 FROM identity_access_notification WHERE id=?",Boolean.class,retried.id())).isTrue();
        assertThat(adapter.claimDue(instant.plusSeconds(21),1)).isEmpty();
    }
    @Test void platformTerminalTransitionsRejectRepeatedEraseAndLateAcknowledgementOrRetry(){
        var adapter=new JdbcIdentityNotificationAdapter(jdbc,"01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));
        var platformAccount=UUID.randomUUID();
        var instant=Instant.now();
        jdbc.update("INSERT INTO identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) VALUES (?,?,?,'PLATFORM_SUPERADMIN',NULL,'ACTIVE','Platform','platform-terminal@example.test',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",platformAccount,"platform-terminal@example.test","$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoOe");
        adapter.enqueue(platformAccount,null,PasswordRecoveryPort.Purpose.PASSWORD_RESET,"platform-terminal@example.test","C".repeat(43),instant.plusSeconds(300));
        var work=adapter.claimDue(instant.plusSeconds(1),1).getFirst();
        adapter.erase(work.id(),null,instant.plusSeconds(2));
        assertThatThrownBy(()->adapter.erase(work.id(),null,instant.plusSeconds(3))).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(()->adapter.delivered(work.id(),null,instant.plusSeconds(3))).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(()->adapter.retry(work.id(),null,instant.plusSeconds(4))).isInstanceOf(IllegalStateException.class);
        assertThat(adapter.claimDue(instant.plusSeconds(31),1)).isEmpty();
    }
    @Test void tenantTransitionRejectsOtherTenantWhileLeasePreventsDuplicateClaim(){
        var adapter=new JdbcIdentityNotificationAdapter(jdbc,"01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));
        var instant=Instant.now();
        adapter.enqueue(account,tenant,PasswordRecoveryPort.Purpose.PASSWORD_RESET,"u@example.test","D".repeat(43),instant.plusSeconds(300));
        var work=adapter.claimDue(instant.plusSeconds(1),1).getFirst();
        assertThat(adapter.claimDue(instant.plusSeconds(2),1)).isEmpty();
        assertThatThrownBy(()->adapter.delivered(work.id(),UUID.randomUUID(),instant.plusSeconds(3))).isInstanceOf(IllegalStateException.class);
        adapter.delivered(work.id(),tenant,instant.plusSeconds(3));
    }
    @Test void currentNotificationUniquenessPreventsMoreThanOneLiveDeliveryPerAccountAndPurpose(){var adapter=new JdbcIdentityNotificationAdapter(jdbc,"01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));var instant=Instant.now();adapter.enqueue(account,tenant,PasswordRecoveryPort.Purpose.PASSWORD_RESET,"u@example.test","A".repeat(43),instant.plusSeconds(60));adapter.enqueue(account,tenant,PasswordRecoveryPort.Purpose.PASSWORD_RESET,"u@example.test","B".repeat(43),instant.plusSeconds(60));assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_notification WHERE superseded_at IS NULL AND delivered_at IS NULL",Integer.class)).isEqualTo(1);}
    @Test void concurrentTokenIssuanceLeavesExactlyOneCurrentToken(){var adapter=new JdbcPasswordRecoveryAdapter(jdbc);var transactions=new TransactionTemplate(new DataSourceTransactionManager(jdbc.getDataSource()));var ready=new CountDownLatch(2);var start=new CountDownLatch(1);try(var pool=Executors.newFixedThreadPool(2)){var first=pool.submit(()->issue(adapter,transactions,ready,start,(byte)1));var second=pool.submit(()->issue(adapter,transactions,ready,start,(byte)2));ready.await();start.countDown();first.get();second.get();}catch(Exception e){throw new AssertionError(e);}assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_action_token WHERE account_id=? AND purpose='PASSWORD_RESET' AND used_at IS NULL AND invalidated_at IS NULL",Integer.class,account)).isEqualTo(1);}
    @Test void acceptedGenericRequestIsDurableEncryptedAndDeduplicatedBeforeWorkerResolution(){var adapter=new JdbcPasswordRecoveryRequestAdapter(jdbc,"01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));adapter.accept("u@example.test",now);adapter.accept("u@example.test",now.plusSeconds(1));assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM identity_access_recovery_request WHERE completed_at IS NULL",Integer.class)).isEqualTo(1);assertThat(jdbc.queryForObject("SELECT identifier_ciphertext::text FROM identity_access_recovery_request",String.class)).doesNotContain("u@example.test");var request=adapter.claimDue(now.plusSeconds(2),1).getFirst();assertThat(request.identifier()).isEqualTo("u@example.test");adapter.completed(request.id(),now.plusSeconds(3));assertThat(jdbc.queryForObject("SELECT octet_length(identifier_ciphertext) FROM identity_access_recovery_request WHERE id=?",Integer.class,request.id())).isZero();}
    private void issue(JdbcPasswordRecoveryAdapter adapter,TransactionTemplate transactions,CountDownLatch ready,CountDownLatch start,byte value){ready.countDown();try{start.await();}catch(InterruptedException e){Thread.currentThread().interrupt();throw new AssertionError(e);}transactions.executeWithoutResult(status->adapter.replaceToken(new PasswordRecoveryPort.Token(account,tenant,PasswordRecoveryPort.Purpose.PASSWORD_RESET,new byte[]{value},now.plusSeconds(60))));}
}
