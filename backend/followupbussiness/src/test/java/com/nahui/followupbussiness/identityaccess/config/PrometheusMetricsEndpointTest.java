package com.nahui.followupbussiness.identityaccess.config;

import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalManagementPort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "followupbussiness.security.local-secret=TEST_ONLY_NON_SECRET_012345678901234567890123456789",
        "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
        "followupbussiness.outbox.enabled=false",
        "management.server.address=127.0.0.1",
        "management.server.port=0",
        "management.endpoints.web.exposure.include=prometheus"
})
class PrometheusMetricsEndpointTest {

    @MockitoBean
    private CompanyUserService companyUserService;

    @Autowired
    private MeterRegistry meterRegistry;

    @LocalManagementPort
    private int managementPort;

    @Test
    void exposesOutboxPublishFailuresOnlyThroughTheTechnicalPrometheusEndpoint() throws Exception {
        meterRegistry.counter("outbox.publish.failures").increment(2.0);

        HttpResponse<String> response = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + managementPort + "/actuator/prometheus"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("outbox_publish_failures_total 2.0");
    }
}
