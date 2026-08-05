package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.port.out.RefreshRateLimitPort;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.List;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

/**
 * Redis is only a fail-closed throttle; the address is the servlet peer, never a client header.
 */
public final class RefreshRateLimiter implements RefreshRateLimitPort {
    private static final DefaultRedisScript<List> SCRIPT = new DefaultRedisScript<>("local c=redis.call('INCR',KEYS[1]); if c==1 then redis.call('EXPIRE',KEYS[1],60); end; return {c,redis.call('TTL',KEYS[1])}", List.class);
    private final StringRedisTemplate redis;
    private final byte[] key;

    public RefreshRateLimiter(StringRedisTemplate redis, byte[] key) {
        this.redis = redis;
        this.key = key.clone();
    }

    public Decision checkPresented(String refresh, String remote) {
        return consume("unknown", refresh + "|" + remote, 120);
    }

    public Decision checkFamily(UUID family, String remote) {
        return consume("family", family + "|" + remote, 30);
    }

    private Decision consume(String scope, String value, long limit) {
        try {
            List<?> r = redis.execute(SCRIPT, List.of("auth:refresh:" + scope + ":" + hmac(value)), "60");
            if (r == null || r.size() != 2 || !(r.get(0) instanceof Number count) || !(r.get(1) instanceof Number ttl))
                throw new IllegalStateException();
            return new Decision(count.longValue() <= limit, Math.max(1, ttl.longValue()));
        } catch (RuntimeException e) {
            throw new UnavailableException();
        }
    }

    private String hmac(String value) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return java.util.HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
