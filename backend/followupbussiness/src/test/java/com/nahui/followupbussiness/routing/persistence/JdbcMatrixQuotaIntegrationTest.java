package com.nahui.followupbussiness.routing.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.nahui.followupbussiness.customers.application.port.in.CustomerPortfolioReadUseCase;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.*;
import com.nahui.followupbussiness.routing.adapter.out.persistence.JdbcMatrixQuota;
import com.nahui.followupbussiness.routing.application.OptimizeRouteService;
import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase;
import com.nahui.followupbussiness.routing.application.port.out.*;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.workforce.application.port.in.*;
import java.time.*; import java.util.*; import java.util.concurrent.*;
import org.flywaydb.core.Flyway; import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate; import org.springframework.jdbc.datasource.*; import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer; import org.testcontainers.utility.DockerImageName;

class JdbcMatrixQuotaIntegrationTest {
 static final PostgreSQLContainer DB=new PostgreSQLContainer(DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres")); DriverManagerDataSource dataSource; DataSourceTransactionManager manager;
 @BeforeAll static void start(){DB.start();} @AfterAll static void stop(){DB.stop();}
 @BeforeEach void migrate(){dataSource=new DriverManagerDataSource(DB.getJdbcUrl(),DB.getUsername(),DB.getPassword());var flyway=Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").cleanDisabled(false).load();flyway.clean();flyway.migrate();manager=new DataSourceTransactionManager(dataSource);}
 @Test void atomicallyAllowsOnlyThirtyFiveConcurrentReservationsPerAccountDay() throws Exception {UUID tenant=UUID.randomUUID(),account=UUID.randomUUID();var start=new CyclicBarrier(36);var pool=Executors.newFixedThreadPool(36);try{var results=new ArrayList<Future<Boolean>>();for(int i=0;i<36;i++)results.add(pool.submit(()->{start.await(30,TimeUnit.SECONDS);return new JdbcMatrixQuota(new JdbcTemplate(dataSource)).reserve(tenant,account,LocalDate.parse("2026-08-25"));}));long granted=0;for(var result:results)if(result.get(30,TimeUnit.SECONDS))granted++;assertThat(granted).isEqualTo(35);assertThat(new JdbcTemplate(dataSource).queryForObject("select used_matrices from route_matrix_quota where tenant_id=? and account_id=? and operational_date=?",Integer.class,tenant,account,LocalDate.parse("2026-08-25"))).isEqualTo(35);}finally{pool.shutdownNow();}}
 @Test void matrixFailuresDoNotReturnQuotaAndThirtySixthCallNeverReachesMatrix(){
  UUID tenant=UUID.randomUUID(),account=UUID.randomUUID(),routeId=UUID.randomUUID(),seller=UUID.randomUUID(),territory=UUID.randomUUID(),customer=UUID.randomUUID();var jdbc=new JdbcTemplate(dataSource);var quota=new JdbcMatrixQuota(jdbc,manager);var routes=mock(RouteStore.class);var proposals=mock(RouteProposalStore.class);var matrix=mock(TravelMatrix.class);var customers=mock(CustomerPortfolioReadUseCase.class);var sellers=mock(SellerReferenceUseCase.class);var scopes=mock(PortfolioAccessScopeUseCase.class);var actor=new AuthenticatedActor(account,tenant,BaseRole.COMPANY_ADMIN);var date=LocalDate.parse("2026-08-25");var command=new OptimizeRouteUseCase.Command(routeId,new OptimizeRouteUseCase.Window(Instant.parse("2026-08-25T08:00:00Z"),Instant.parse("2026-08-25T18:00:00Z")),1,List.of(new OptimizeRouteUseCase.Visit(customer,1,1,List.of())));
  when(scopes.resolve(actor)).thenReturn(new PortfolioAccessScopeUseCase.Scope(tenant,true,Set.of()));when(routes.find(tenant,routeId)).thenReturn(Optional.of(new Route(routeId,tenant,"Draft",date,seller,new GeoPoint(0,0),List.of(new Route.Point(UUID.randomUUID(),customer,1,new GeoPoint(0,0))),Instant.EPOCH,Instant.EPOCH,1,"DRAFT")));when(sellers.activeTerritory(tenant,territory)).thenReturn(true);when(sellers.activeAssignedToTerritory(tenant,seller,territory)).thenReturn(true);when(customers.activeAssignedToSellerAt(eq(tenant),eq(seller),any(),eq(date))).thenReturn(List.of(new CustomerPortfolioReadUseCase.RouteCustomer(customer,new GeoPoint(0,0),territory)));when(matrix.calculate(any())).thenThrow(new IllegalStateException("unavailable"));var service=new OptimizeRouteService(routes,proposals,matrix,customers,sellers,scopes,quota,Clock.systemUTC());var outer=new TransactionTemplate(manager);
  for(int i=0;i<35;i++)assertThatThrownBy(()->outer.execute(status->service.optimize(command,actor))).isInstanceOf(OptimizeRouteUseCase.Unavailable.class);
  assertThatThrownBy(()->outer.execute(status->service.optimize(command,actor))).isInstanceOf(OptimizeRouteUseCase.RateLimited.class);verify(matrix,times(35)).calculate(any());verifyNoInteractions(proposals);assertThat(jdbc.queryForObject("select used_matrices from route_matrix_quota where tenant_id=? and account_id=? and operational_date=?",Integer.class,tenant,account,date)).isEqualTo(35);
 }
}
