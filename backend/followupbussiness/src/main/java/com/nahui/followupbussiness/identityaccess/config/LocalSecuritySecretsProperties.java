package com.nahui.followupbussiness.identityaccess.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@ConfigurationProperties(prefix = "field-sales.security")
public final class LocalSecuritySecretsProperties implements InitializingBean {

    static final int MINIMUM_SECRET_LENGTH = 32;

    private static final String ENVIRONMENT_VARIABLE = "FIELD_SALES_SECURITY_LOCAL_SECRET";
    private static final List<byte[]> REJECTED_PLACEHOLDERS = List.of(
            "change_me_local_only".getBytes(StandardCharsets.UTF_8),
            "replace_with_32_plus_random_local_characters".getBytes(StandardCharsets.UTF_8));

    private String localSecret;

    public void setLocalSecret(String localSecret) {
        this.localSecret = localSecret;
    }

    @Override
    public void afterPropertiesSet() {
        if (localSecret == null || localSecret.isBlank()) {
            throw new IllegalStateException(
                    ENVIRONMENT_VARIABLE + " is required; its value was not logged");
        }

        String normalizedSecret = stripBoundaryWhitespace(localSecret);
        boolean rejectedPlaceholder = isRejectedPlaceholder(normalizedSecret);
        if (!localSecret.equals(normalizedSecret)) {
            throw new IllegalStateException(
                    ENVIRONMENT_VARIABLE + " must not contain leading or trailing whitespace; its value was not logged");
        }
        if (normalizedSecret.length() < MINIMUM_SECRET_LENGTH || rejectedPlaceholder) {
            throw new IllegalStateException(
                    ENVIRONMENT_VARIABLE + " must be a non-placeholder value of at least "
                            + MINIMUM_SECRET_LENGTH + " characters; its value was not logged");
        }
    }

    private static boolean isRejectedPlaceholder(String normalizedSecret) {
        byte[] candidate = normalizedSecret.getBytes(StandardCharsets.UTF_8);
        boolean rejected = false;
        for (byte[] placeholder : REJECTED_PLACEHOLDERS) {
            rejected |= MessageDigest.isEqual(candidate, placeholder);
        }
        return rejected;
    }

    private static String stripBoundaryWhitespace(String value) {
        int start = 0;
        int end = value.length();

        while (start < end) {
            int codePoint = value.codePointAt(start);
            if (!isWhitespace(codePoint)) {
                break;
            }
            start += Character.charCount(codePoint);
        }
        while (start < end) {
            int codePoint = value.codePointBefore(end);
            if (!isWhitespace(codePoint)) {
                break;
            }
            end -= Character.charCount(codePoint);
        }
        return value.substring(start, end);
    }

    private static boolean isWhitespace(int codePoint) {
        return Character.isWhitespace(codePoint) || Character.isSpaceChar(codePoint);
    }
}
