package com.nahui.followupbussiness.identityaccess.adapter.out.security;

import com.nahui.followupbussiness.identityaccess.application.port.out.LogoutAbuseMonitor;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.data.redis.core.StringRedisTemplate;

/** Redis only records a 5/hour dedupe signal. Errors deliberately cannot block logout. */
public final class RedisLogoutAbuseMonitor implements LogoutAbuseMonitor {
    private final StringRedisTemplate redis; private final byte[] secret;
    public RedisLogoutAbuseMonitor(StringRedisTemplate redis, byte[] secret) { this.redis=redis; this.secret=secret.clone(); }
    public Decision recordGlobal(UUID account, UUID tenant) { try { String key="auth:logout:dedupe:"+digest(account+":"+tenant); Long n=redis.opsForValue().increment(key); if(n!=null && n==1) redis.expire(key, Duration.ofHours(1)); long attempts=n==null?0:n; return new Decision(attempts>5,attempts); } catch(RuntimeException ignored) { return new Decision(false,0); } }
    private String digest(String input) { try { var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secret,"HmacSHA256")); byte[] out=mac.doFinal(input.getBytes(StandardCharsets.UTF_8)); var hex=new StringBuilder();for(byte b:out)hex.append(String.format("%02x",b));return hex.toString(); } catch(Exception e) { throw new IllegalStateException(e); } }
}
