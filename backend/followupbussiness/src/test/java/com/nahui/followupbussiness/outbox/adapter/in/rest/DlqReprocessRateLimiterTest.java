package com.nahui.followupbussiness.outbox.adapter.in.rest;

import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DlqReprocessRateLimiterTest {
    @Test
    void rejectsAnOperatorBudgetExhaustionWithoutStoringOperatorOrOriginInTheRedisKey() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.execute(any(), anyList(), anyString())).thenReturn(List.of(21L, 17L), List.of(1L, 17L));
        DlqReprocessRateLimiter limiter = new DlqReprocessRateLimiter(redis, "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));

        var decision = limiter.check("00000000-0000-0000-0000-000000000002", "198.51.100.20");

        assertThat(decision.allowed()).isFalse();
        assertThat(decision.retryAfterSeconds()).isEqualTo(17);
    }
}
