package com.nahui.followupbussiness.identityaccess.adapter.in.rest;
import java.nio.charset.StandardCharsets; import java.util.List; import java.util.UUID; import org.junit.jupiter.api.Test; import org.springframework.data.redis.core.StringRedisTemplate;
import static org.assertj.core.api.Assertions.*; import static org.mockito.ArgumentMatchers.*; import static org.mockito.Mockito.*;
class RefreshRateLimiterTest {
 @Test void pseudonymizesKeysAndEnforcesUnknownAndFamilyLimits(){var redis=mock(StringRedisTemplate.class);when(redis.execute(any(),anyList(),anyString())).thenReturn(List.of(121L,42L));var l=new RefreshRateLimiter(redis,"01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));assertThat(l.checkPresented("x".repeat(43),"192.0.2.1")).isEqualTo(new com.nahui.followupbussiness.identityaccess.application.port.out.RefreshRateLimitPort.Decision(false,42));}
 @Test void failsClosedWhenRedisIsUnavailable(){var redis=mock(StringRedisTemplate.class);when(redis.execute(any(),anyList(),anyString())).thenThrow(new IllegalStateException());assertThatThrownBy(()->new RefreshRateLimiter(redis,"01234567890123456789012345678901".getBytes()).checkFamily(UUID.randomUUID(),"127.0.0.1")).isInstanceOf(com.nahui.followupbussiness.identityaccess.application.port.out.RefreshRateLimitPort.UnavailableException.class);}
}
