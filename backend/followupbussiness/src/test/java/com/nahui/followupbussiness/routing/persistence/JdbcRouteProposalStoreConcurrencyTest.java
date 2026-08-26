package com.nahui.followupbussiness.routing.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcRouteProposalStore;
import java.util.*; import java.util.concurrent.*;
import org.flywaydb.core.Flyway; import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate; import org.springframework.jdbc.datasource.*; import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer; import org.testcontainers.utility.DockerImageName;

class JdbcRouteProposalStoreConcurrencyTest {
 static final PostgreSQLContainer DB=new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));
 DriverManagerDataSource dataSource; TransactionTemplate transactions; JdbcTemplate jdbc;
 @BeforeAll static void start(){DB.start();} @AfterAll static void stop(){DB.stop();}
 @BeforeEach void migrate(){dataSource=new DriverManagerDataSource(DB.getJdbcUrl(),DB.getUsername(),DB.getPassword());var flyway=Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").cleanDisabled(false).load();flyway.clean();flyway.migrate();jdbc=new JdbcTemplate(dataSource);transactions=new TransactionTemplate(new DataSourceTransactionManager(dataSource));}
 @Test void twoPostgresTransactionsSynchronizeOnAdvisoryLockAndReserveDistinctVersionsWithoutException() throws Exception {
  UUID tenant=UUID.randomUUID(),route=route(tenant);var start=new CyclicBarrier(2);var pool=Executors.newFixedThreadPool(2);
  try {Future<Long> first=pool.submit(()->reserve(start,tenant,route));Future<Long> second=pool.submit(()->reserve(start,tenant,route));assertThat(List.of(first.get(30,TimeUnit.SECONDS),second.get(30,TimeUnit.SECONDS))).containsExactlyInAnyOrder(1L,2L);assertThat(jdbc.queryForObject("select count(*) from route_optimization_proposal where tenant_id=? and route_id=?",Integer.class,tenant,route)).isEqualTo(2);} finally {pool.shutdownNow();}
 }
 private long reserve(CyclicBarrier start,UUID tenant,UUID route) throws Exception {start.await(30,TimeUnit.SECONDS);return transactions.execute(status->{var store=new JdbcRouteProposalStore(new JdbcTemplate(dataSource));long version=store.nextVersion(tenant,route);var result=new com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase.Result(route,version,1,false,List.of(),List.of(),0,0,0,"FEASIBLE",java.time.Instant.now());store.save(tenant,route,account(tenant),UUID.randomUUID(),result,""," ");return version;});}
 private UUID route(UUID tenant){UUID account=account(tenant),seller=UUID.randomUUID(),route=UUID.randomUUID();jdbc.update("insert into workforce_seller(id,tenant_id,user_id,display_name,email,status,created_at,updated_at,version) values(?,?,?,'Seller','seller@example.test','ACTIVE',current_timestamp,current_timestamp,1)",seller,tenant,account);jdbc.update("insert into route(id,tenant_id,operational_date,seller_id,status,created_at,updated_at,version) values(?,?,current_date,?,'DRAFT',current_timestamp,current_timestamp,1)",route,tenant,seller);return route;}
 private UUID account(UUID tenant){UUID id=UUID.randomUUID();jdbc.update("insert into tenancy_company(id,status,created_at,updated_at) values(?,'ACTIVE',current_timestamp,current_timestamp) on conflict do nothing",tenant);jdbc.update("insert into identity_access_account(id,login_identifier,password_hash,role_code,company_id,status,display_name,email,created_at,updated_at) values(?,?,?,'SELLER',?,'ACTIVE','Seller',?,current_timestamp,current_timestamp)",id,"seller-"+id,"$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoAA",tenant,"seller-"+id+"@example.test");return id;}
}
