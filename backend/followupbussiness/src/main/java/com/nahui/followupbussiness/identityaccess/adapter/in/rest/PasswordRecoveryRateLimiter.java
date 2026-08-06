package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

public final class PasswordRecoveryRateLimiter {
    private static final DefaultRedisScript<List> INCREMENT = new DefaultRedisScript<>("local c=redis.call('INCR',KEYS[1]); if c==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return {c,redis.call('TTL',KEYS[1])}", List.class);
    private final StringRedisTemplate redis;
    private final byte[] secret;

    public PasswordRecoveryRateLimiter(StringRedisTemplate redis, byte[] secret) {
        this.redis = redis;
        this.secret = secret.clone();
    }

    public Decision request(String identifier, String ip) {
        return combine(take("recovery:id", identifier, 3, 3600), take("recovery:ip", ip, 20, 3600));
    }

    public Decision consume(String token, String ip) {
        return combine(take("reset:token-ip", token + "|" + ip, 5, 900), take("reset:ip", ip, 30, 900));
    }

    private Decision take(String scope, String value, long limit, long window) {
        try {
            List<?> r = redis.execute(INCREMENT, List.of("auth:rate:" + scope + ":" + hmac(value)), Long.toString(window));
            if (r == null || r.size() != 2 || !(r.get(0) instanceof Number c) || !(r.get(1) instanceof Number ttl))
                throw new IllegalStateException();
            return new Decision(c.longValue() <= limit, Math.max(1, ttl.longValue()));
        } catch (RuntimeException e) {
            throw new Unavailable();
        }
    }

    private String hmac(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return java.util.HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static Decision combine(Decision... d) {
        boolean ok = true;
        long retry = 1;
        for (var x : d) {
            ok &= x.allowed;
            retry = Math.max(retry, x.retryAfter);
        }
        return new Decision(ok, retry);
    }

    public record Decision(boolean allowed, long retryAfter) {
    }

    public static final class Unavailable extends RuntimeException {
    }
}
