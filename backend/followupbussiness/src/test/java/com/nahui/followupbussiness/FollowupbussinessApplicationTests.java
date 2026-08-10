package com.nahui.followupbussiness;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.identityaccess.adapter.in.cli.PlatformSuperadminBootstrapRunner;
import com.nahui.followupbussiness.identityaccess.adapter.in.security.InboundJwtAuthenticator;
import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.application.LoginService;
import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryService;
import com.nahui.followupbussiness.identityaccess.application.PasswordRecoveryRequestWorker;
import com.nahui.followupbussiness.identityaccess.application.port.in.BootstrapPlatformSuperadminUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.LogoutSessionUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.ProvisionInitialCompanyAdminUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.in.RefreshSessionUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
		"followupbussiness.security.local-secret=TEST_ONLY_NON_SECRET_012345678901234567890123456789",
		"spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
		"followupbussiness.outbox.enabled=false"
})
class FollowupbussinessApplicationTests {

	@MockitoBean
	private CompanyUserService companyUserService;

	@MockitoBean
	private LoginService loginService;

	@MockitoBean
	private ProvisionInitialCompanyAdminUseCase provisionInitialCompanyAdminUseCase;

	@MockitoBean
	private LogoutSessionUseCase logoutSessionUseCase;

	@MockitoBean
	private PasswordRecoveryService passwordRecoveryService;

	@MockitoBean
	private RefreshSessionUseCase refreshSessionUseCase;

	@MockitoBean
	private JdbcTemplate jdbcTemplate;

	@MockitoBean
	private PlatformTransactionManager transactionManager;

	@MockitoBean
	private AuditEntryStore auditEntryStore;

	@MockitoBean
	private PasswordRecoveryRequestWorker passwordRecoveryRequestWorker;

	@MockitoBean
	private InboundJwtAuthenticator inboundJwtAuthenticator;

	@Autowired
	private ApplicationContext applicationContext;

	@Test
	void contextLoads() {
	}

	@Test
	void ordinaryStartupDoesNotRegisterBootstrapCommand() {
		assertThat(applicationContext.getBeansOfType(PlatformSuperadminBootstrapRunner.class)).isEmpty();
		assertThat(applicationContext.getBeansOfType(BootstrapPlatformSuperadminUseCase.class)).isEmpty();
	}

}
