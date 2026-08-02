package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LoginRateLimiterTest {
    @Test
    void usesHmacRedisKeysAndReturnsTtlWhenAnyAccumulatedLimitIsExceeded() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.execute(any(), anyList(), anyString())).thenReturn(List.of(6L, 899L));

        var limiter = new LoginRateLimiter(redis, hmacKey());

        var decision = limiter.check("person@example.test", "192.0.2.10");

        assertThat(decision.allowed()).isFalse();
        assertThat(decision.retryAfterSeconds()).isEqualTo(899);
    }

    @Test
    void failsClosedWhenRedisCannotApplyTheWindow() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.execute(any(), anyList(), anyString())).thenThrow(new IllegalStateException("down"));

        assertThatThrownBy(() -> new LoginRateLimiter(redis, hmacKey()).check("person@example.test", "192.0.2.10"))
                .isInstanceOf(LoginRateLimiter.UnavailableException.class);
    }

    private static byte[] hmacKey() {
        return "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);
    }
}
