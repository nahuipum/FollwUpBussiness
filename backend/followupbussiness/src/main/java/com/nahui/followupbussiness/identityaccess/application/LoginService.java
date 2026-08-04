package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.application.port.out.*;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.*;

public final class LoginService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String DUMMY_BCRYPT_HASH = "$2a$12$7EqJtq98hPqEX7fNZaFWoO9fkg8rDs3umP5e0yZG5qR1zwVmzEoOe";
    private final LoginAccountQuery accounts;
    private final PasswordHashingPort passwords;
    private final CompanyAccessStatusQuery companies;
    private final SessionFamilyPort sessions;
    private final AccessTokenPort tokens;
    private final Clock clock;
    private final byte[] hmacKey;

    public LoginService(LoginAccountQuery accounts, PasswordHashingPort passwords, CompanyAccessStatusQuery companies, SessionFamilyPort sessions, AccessTokenPort tokens, Clock clock, byte[] hmacKey) {
        this.accounts = accounts;
        this.passwords = passwords;
        this.companies = companies;
        this.sessions = sessions;
        this.tokens = tokens;
        this.clock = clock;
        this.hmacKey = hmacKey.clone();
    }

    public Result login(String identifier, char[] password, String channel, UUID clientInstanceId) {
        var candidate = accounts.findByIdentifier(identifier);
        if (candidate.isEmpty() || !hasUsableState(candidate.orElseThrow())) {
            verifyDummy(password);
            throw new LoginFailedException();
        }
        var account = candidate.orElseThrow();
        if (!passwords.matches(password, account.passwordHash())) throw new LoginFailedException();
        UUID sessionId = UUID.randomUUID();
        Instant now = clock.instant();
        String refresh = secret(), csrf = "WEB".equals(channel) ? secret() : null, ticket = "MOBILE".equals(channel) ? secret() : null;
        sessions.create(sessionId, account.id(), account.companyId(), channel, digest(clientInstanceId.toString()), digest(refresh), csrf == null ? null : digest(csrf), ticket == null ? null : digest(ticket), now.plusSeconds(2_592_000), now);
        return new Result(tokens.issue(account.id(), sessionId, account.companyId(), account.role()), refresh, csrf, ticket, account, channel);
    }

    private boolean hasUsableState(LoginAccountQuery.Account a) {
        return "ACTIVE".equals(a.status()) && a.displayName() != null && !a.displayName().isBlank() && a.email() != null && !a.email().isBlank() && (a.companyId() == null || companies.isActive(a.companyId()));
    }

    private void verifyDummy(char[] password) {
        passwords.matches(password, DUMMY_BCRYPT_HASH);
    }

    private String secret() {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private byte[] digest(String v) {
        try {
            var mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(hmacKey, "HmacSHA256"));
            return mac.doFinal(v.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public record Result(String accessToken, String refreshToken, String csrfToken, String revocationTicket,
                         LoginAccountQuery.Account account, String channel) {
    }

    public static final class LoginFailedException extends RuntimeException {
    }
}
