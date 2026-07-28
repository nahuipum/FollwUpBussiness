package com.nahui.followupbussiness;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "field-sales.security.local-secret=TEST_ONLY_NON_SECRET_012345678901234567890123456789")
class FollowupbussinessApplicationTests {

	@Test
	void contextLoads() {
	}

}
