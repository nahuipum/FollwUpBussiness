package com.nahui.followupbussiness.identityaccess.adapter.in.security;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.PublicKey;
import java.security.Signature;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Validates a signed access token and rechecks the session/account state in PostgreSQL.
 */
public final class InboundJwtAuthenticator {
    private final PublicKey publicKey;
    private final String issuer;
    private final String audience;
    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;
    private final JsonMapper json = JsonMapper.builder().build();

    public InboundJwtAuthenticator(PublicKey publicKey, String issuer, String audience, JdbcTemplate jdbcTemplate, Clock clock) {
        this.publicKey = publicKey;
        this.issuer = issuer;
        this.audience = audience;
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    public Authentication authenticate(String bearerToken) {
        try {
            String[] parts = bearerToken.split("\\.", -1);
            if (parts.length != 3) throw new JwtValidationException();
            JsonNode header = parse(parts[0]);
            JsonNode claims = parse(parts[1]);
            if (!"RS256".equals(header.path("alg").asText()) || !verify(parts)) throw new JwtValidationException();
            UUID subject = UUID.fromString(claims.path("sub").asText());
            UUID session = UUID.fromString(claims.path("sid").asText());
            String role = singleRole(claims);
            if (!issuer.equals(claims.path("iss").asText()) || !hasAudience(claims) || claims.path("exp").asLong(0) <= clock.instant().getEpochSecond())
                throw new JwtValidationException();
            var tenantIds = jdbcTemplate.query("""
                    SELECT account.company_id FROM identity_access_session_family session
                    JOIN identity_access_account account ON account.id = session.account_id
                    LEFT JOIN tenancy_company company ON company.id = account.company_id
                    WHERE session.id = ? AND session.account_id = ? AND session.revoked_at IS NULL AND session.expires_at > ?
                      AND account.status = 'ACTIVE' AND account.role_code = ?
                      AND session.company_id IS NOT DISTINCT FROM account.company_id
                      AND (account.company_id IS NULL OR company.status = 'ACTIVE')
                    """, (rs, row) -> rs.getObject(1, UUID.class), session, subject, Timestamp.from(clock.instant()), role);
            if (tenantIds.size() != 1) throw new JwtValidationException();
            BaseRole persistedRole = BaseRole.findByCode(role).orElseThrow(JwtValidationException::new);
            UUID tenantId = tenantIds.getFirst();
            if (persistedRole.scope() == com.nahui.followupbussiness.identityaccess.domain.model.RoleScope.PLATFORM ? tenantId != null : tenantId == null)
                throw new JwtValidationException();
            return UsernamePasswordAuthenticationToken.authenticated(
                    new AuthenticatedActor(subject, tenantId, persistedRole), bearerToken, List.of(new SimpleGrantedAuthority(role)));
        } catch (GeneralSecurityException | RuntimeException exception) {
            if (exception instanceof JwtValidationException) throw (JwtValidationException) exception;
            throw new JwtValidationException();
        }
    }

    private JsonNode parse(String encoded) {
        try {
            return json.readTree(Base64.getUrlDecoder().decode(encoded));
        } catch (Exception exception) {
            throw new JwtValidationException();
        }
    }

    private boolean verify(String[] parts) throws GeneralSecurityException {
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initVerify(publicKey);
        signature.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
        return signature.verify(Base64.getUrlDecoder().decode(parts[2]));
    }

    private String singleRole(JsonNode claims) {
        JsonNode roles = claims.path("roles");
        if (!roles.isArray() || roles.size() != 1 || BaseRole.findByCode(roles.get(0).asText()).isEmpty())
            throw new JwtValidationException();
        return roles.get(0).asText();
    }

    private boolean hasAudience(JsonNode claims) {
        JsonNode audiences = claims.path("aud");
        if (audiences.isTextual()) return audience.equals(audiences.asText());
        if (audiences.isArray()) for (JsonNode value : audiences) if (audience.equals(value.asText())) return true;
        return false;
    }

    public static final class JwtValidationException extends org.springframework.security.core.AuthenticationException {
        public JwtValidationException() {
            super("Invalid access token");
        }
    }
}
