package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.application.port.out.IdentityNotificationPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordHashingPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryRequestPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.RefreshSessionPort;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class PasswordRecoveryService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final PasswordRecoveryPort recovery;
    private final PasswordRecoveryRequestPort requests;
    private final IdentityNotificationPort notifications;
    private final RefreshSessionPort sessions;
    private final PasswordHashingPort passwords;
    private final Clock clock;
    private final byte[] hmacKey;

    public PasswordRecoveryService(PasswordRecoveryPort recovery, PasswordRecoveryRequestPort requests, IdentityNotificationPort notifications, RefreshSessionPort sessions, PasswordHashingPort passwords, Clock clock, byte[] hmacKey) {
        this.recovery = recovery;
        this.requests = requests;
        this.notifications = notifications;
        this.sessions = sessions;
        this.passwords = passwords;
        this.clock = clock;
        this.hmacKey = hmacKey.clone();
    }

    /** Accepts only the opaque request input; account resolution happens in the worker. */
    public void accept(String identifier) {
        requests.accept(identifier, clock.instant());
    }

    /**
     * Deliberately has no result: the inbound adapter returns the same response for every eligible state.
     */
    public void request(String identifier) {
        var account = recovery.findEligibleByIdentifier(identifier);
        if (account == null) return;
        var purpose = "INVITED".equals(account.status()) ? PasswordRecoveryPort.Purpose.ACTIVATION : PasswordRecoveryPort.Purpose.PASSWORD_RESET;
        Instant expires = clock.instant().plus(purpose == PasswordRecoveryPort.Purpose.ACTIVATION ? Duration.ofHours(24) : Duration.ofMinutes(30));
        String token = secret();
        recovery.replaceToken(new PasswordRecoveryPort.Token(account.id(), account.tenantId(), purpose, digest(token), expires));
        notifications.enqueue(account.id(), account.tenantId(), purpose, identifier, token, expires);
    }

    public void reset(String token, char[] password) {
        if (token == null || token.length() != 43) throw new Rejected(Code.INVALID);
        if (!policy(password)) throw new Rejected(Code.POLICY);
        Instant now = clock.instant();
        var action = recovery.consume(digest(token), now);
        if (action == null) throw new Rejected(Code.INVALID);
        if (!action.expiresAt().isAfter(now)) throw new Rejected(Code.EXPIRED);
        boolean activation = action.purpose() == PasswordRecoveryPort.Purpose.ACTIVATION;
        recovery.resetAccount(action.accountId(), action.tenantId(), passwords.hash(password), activation, now);
        sessions.revokeAll(action.accountId(), action.tenantId(), now);
        recovery.invalidateAccountTokens(action.accountId(), now);
    }

    private boolean policy(char[] value) {
        if (value == null || value.length < 8 || new String(value).getBytes(StandardCharsets.UTF_8).length > 72) return false;
        boolean upper = false, lower = false, digit = false;
        for (char c : value) {
            upper |= Character.isUpperCase(c);
            lower |= Character.isLowerCase(c);
            digit |= Character.isDigit(c);
        }
        return upper && lower && digit;
    }

    private String secret() {
        byte[] value = new byte[32];
        RANDOM.nextBytes(value);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private byte[] digest(String value) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacKey, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to digest action token", e);
        }
    }

    public enum Code {INVALID, EXPIRED, POLICY}

    public static final class Rejected extends RuntimeException {
        public final Code code;

        public Rejected(Code code) {
            this.code = code;
        }
    }
}
