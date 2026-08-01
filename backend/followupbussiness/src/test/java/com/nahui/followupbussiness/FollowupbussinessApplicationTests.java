package com.nahui.followupbussiness;

import com.nahui.followupbussiness.identityaccess.adapter.in.cli.PlatformSuperadminBootstrapRunner;
import com.nahui.followupbussiness.identityaccess.application.port.in.BootstrapPlatformSuperadminUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
		"field-sales.security.local-secret=TEST_ONLY_NON_SECRET_012345678901234567890123456789",
		"spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
		"fieldsales.outbox.enabled=false"
})
class FollowupbussinessApplicationTests {

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
