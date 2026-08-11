package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doAnswer;
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

    @Test
    void resetsOnlyIdentifierScopedHmacCountersAfterSuccessfulAuthentication() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        var limiter = new LoginRateLimiter(redis, hmacKey());

        limiter.reset("person@example.test", "192.0.2.10");

        var keys = org.mockito.ArgumentCaptor.forClass(List.class);
        verify(redis).delete(keys.capture());
        assertThat(keys.getValue()).hasSize(2)
                .allSatisfy(key -> {
                    String redisKey = (String) key;
                    assertThat(redisKey).startsWith("auth:rate:").doesNotContain("person@example.test", "192.0.2.10");
                });
    }

    @Test
    void resetMakesTheNextCorrectLoginStartWithFreshCounters() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        Map<String, Long> counters = new HashMap<>();
        when(redis.execute(any(), anyList(), anyString())).thenAnswer(invocation -> {
            List<String> keys = invocation.getArgument(1);
            long count = counters.merge(keys.getFirst(), 1L, Long::sum);
            return List.of(count, 900L);
        });
        doAnswer(invocation -> {
            Collection<String> keys = invocation.getArgument(0);
            keys.forEach(counters::remove);
            return 3L;
        }).when(redis).delete(anyList());
        var limiter = new LoginRateLimiter(redis, hmacKey());

        for (int attempt = 0; attempt < 5; attempt++) {
            assertThat(limiter.check("person@example.test", "192.0.2.10").allowed()).isTrue();
        }
        assertThat(limiter.check("person@example.test", "192.0.2.10").allowed()).isFalse();

        limiter.reset("person@example.test", "192.0.2.10");

        assertThat(limiter.check("person@example.test", "192.0.2.10").allowed()).isTrue();
    }

    @Test
    void resetPreservesTheIpQuotaAcrossDifferentAccounts() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        Map<String, Long> counters = new HashMap<>();
        when(redis.execute(any(), anyList(), anyString())).thenAnswer(invocation -> {
            List<String> keys = invocation.getArgument(1);
            long count = counters.merge(keys.getFirst(), 1L, Long::sum);
            return List.of(count, 900L);
        });
        doAnswer(invocation -> {
            Collection<String> keys = invocation.getArgument(0);
            keys.forEach(counters::remove);
            return 2L;
        }).when(redis).delete(anyList());
        var limiter = new LoginRateLimiter(redis, hmacKey());

        assertThat(limiter.check("account-a@example.test", "192.0.2.10").allowed()).isTrue();
        limiter.reset("account-a@example.test", "192.0.2.10");
        for (int attempt = 1; attempt < 30; attempt++) {
            assertThat(limiter.check("account-" + attempt + "@example.test", "192.0.2.10").allowed()).isTrue();
        }

        assertThat(limiter.check("account-b@example.test", "192.0.2.10").allowed()).isFalse();
    }

    private static byte[] hmacKey() {
        return "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);
    }
}
