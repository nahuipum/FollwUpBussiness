package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

/**
 * Redis-backed, fail-closed authentication throttle. Keys contain only HMACs so a
 * cache dump cannot reveal a submitted login identity or address.
 */
public final class LoginRateLimiter {
    private static final long WINDOW_SECONDS = 900;
    private static final DefaultRedisScript<List> INCREMENT_WINDOW = new DefaultRedisScript<>(
            "local count = redis.call('INCR', KEYS[1]); "
                    + "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; "
                    + "return {count, redis.call('TTL', KEYS[1])}", List.class);

    private final StringRedisTemplate redis;
    private final byte[] hmacKey;

    public LoginRateLimiter(StringRedisTemplate redis, byte[] hmacKey) {
        this.redis = redis;
        this.hmacKey = hmacKey.clone();
    }

    Decision check(String identifier, String remoteAddress) {
        try {
            Decision identifierDecision = consume("identifier", identifier, 5);
            Decision pairDecision = consume("identifier-ip", identifier + "|" + remoteAddress, 5);
            Decision addressDecision = consume("ip", remoteAddress, 30);
            return Decision.combine(identifierDecision, pairDecision, addressDecision);
        } catch (RuntimeException exception) {
            throw new UnavailableException();
        }
    }

    private Decision consume(String scope, String value, long limit) {
        List<?> result = redis.execute(INCREMENT_WINDOW, List.of("auth:rate:" + scope + ":" + hmac(value)), String.valueOf(WINDOW_SECONDS));
        if (result == null || result.size() != 2 || !(result.get(0) instanceof Number count) || !(result.get(1) instanceof Number ttl)) {
            throw new IllegalStateException("Unexpected Redis rate-limit response");
        }
        return new Decision(count.longValue() <= limit, Math.max(1, ttl.longValue()));
    }

    private String hmac(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacKey, "HmacSHA256"));
            return java.util.HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to pseudonymize rate-limit key", exception);
        }
    }

    record Decision(boolean allowed, long retryAfterSeconds) {
        static Decision combine(Decision... decisions) {
            boolean allowed = true;
            long retryAfter = 1;
            for (Decision decision : decisions) {
                allowed &= decision.allowed;
                if (!decision.allowed) retryAfter = Math.max(retryAfter, decision.retryAfterSeconds);
            }
            return new Decision(allowed, retryAfter);
        }
    }
    static final class UnavailableException extends RuntimeException {}
}
