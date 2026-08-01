package com.nahui.followupbussiness.identityaccess.adapter.in.cli;

import com.nahui.followupbussiness.identityaccess.domain.model.LoginIdentifier;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

public final class BootstrapSuperadminCredentialsReader {

    public static final String IDENTITY_VARIABLE =
            "FIELD_SALES_BOOTSTRAP_SUPERADMIN_IDENTITY";
    public static final String PASSWORD_VARIABLE =
            "FIELD_SALES_BOOTSTRAP_SUPERADMIN_PASSWORD";
    static final int MINIMUM_PASSWORD_LENGTH = 16;
    static final int MAXIMUM_PASSWORD_BYTES = 72;

    private static final List<byte[]> REJECTED_PASSWORD_PLACEHOLDERS = List.of(
            "change_me_local_only".getBytes(StandardCharsets.UTF_8),
            "replace_with_32_plus_random_local_characters".getBytes(StandardCharsets.UTF_8));

    private final Function<String, String> environmentReader;

    public BootstrapSuperadminCredentialsReader(Function<String, String> environmentReader) {
        this.environmentReader = environmentReader;
    }

    public BootstrapSuperadminCredentials read() {
        LoginIdentifier loginIdentifier = readIdentity();
        char[] password = readPassword();
        return new BootstrapSuperadminCredentials(loginIdentifier, password);
    }

    private LoginIdentifier readIdentity() {
        String rawIdentity = environmentReader.apply(IDENTITY_VARIABLE);
        if (rawIdentity == null || rawIdentity.isBlank()) {
            throw invalid(IDENTITY_VARIABLE, "is required");
        }
        try {
            return LoginIdentifier.fromOperatorInput(rawIdentity);
        } catch (IllegalArgumentException exception) {
            throw invalid(
                    IDENTITY_VARIABLE,
                    "must be canonicalizable, contain no boundary whitespace or control characters, "
                            + "and use at most " + LoginIdentifier.MAXIMUM_LENGTH + " characters");
        }
    }

    private char[] readPassword() {
        String rawPassword = environmentReader.apply(PASSWORD_VARIABLE);
        if (rawPassword == null || rawPassword.isBlank()) {
            throw invalid(PASSWORD_VARIABLE, "is required");
        }

        String normalizedPassword = stripBoundaryWhitespace(rawPassword);
        boolean rejectedPlaceholder = isRejectedPlaceholder(normalizedPassword);
        if (!rawPassword.equals(normalizedPassword)) {
            throw invalid(PASSWORD_VARIABLE, "must not contain boundary whitespace");
        }
        int characterCount = normalizedPassword.codePointCount(0, normalizedPassword.length());
        int encodedLength = utf8Length(normalizedPassword);
        if (characterCount < MINIMUM_PASSWORD_LENGTH
                || encodedLength > MAXIMUM_PASSWORD_BYTES
                || rejectedPlaceholder) {
            throw invalid(
                    PASSWORD_VARIABLE,
                    "must be a non-placeholder value of at least "
                            + MINIMUM_PASSWORD_LENGTH + " characters and at most "
                            + MAXIMUM_PASSWORD_BYTES + " UTF-8 bytes");
        }
        return rawPassword.toCharArray();
    }

    private static boolean isRejectedPlaceholder(String value) {
        byte[] candidate = value.getBytes(StandardCharsets.UTF_8);
        try {
            boolean rejected = false;
            for (byte[] placeholder : REJECTED_PASSWORD_PLACEHOLDERS) {
                rejected |= MessageDigest.isEqual(candidate, placeholder);
            }
            return rejected;
        } finally {
            Arrays.fill(candidate, (byte) 0);
        }
    }

    private static int utf8Length(String value) {
        byte[] encoded = value.getBytes(StandardCharsets.UTF_8);
        try {
            return encoded.length;
        } finally {
            Arrays.fill(encoded, (byte) 0);
        }
    }

    private static SafeBootstrapConfigurationException invalid(String variable, String rule) {
        return new SafeBootstrapConfigurationException(
                variable + " " + rule + "; its value was not logged");
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
