package com.nahui.followupbussiness.identityaccess.domain.model;

import java.util.Locale;

public record LoginIdentifier(String value) {

    public static final int MAXIMUM_LENGTH = 320;

    public LoginIdentifier {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Login identity is required");
        }
        if (!value.equals(value.strip())) {
            throw new IllegalArgumentException("Login identity must not contain boundary whitespace");
        }
        if (value.length() > MAXIMUM_LENGTH) {
            throw new IllegalArgumentException("Login identity exceeds the supported length");
        }
        if (value.codePoints().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Login identity must not contain control characters");
        }
        if (!value.equals(value.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Login identity must be canonical");
        }
    }

    public static LoginIdentifier fromOperatorInput(String rawValue) {
        if (rawValue == null) {
            throw new IllegalArgumentException("Login identity is required");
        }
        String stripped = rawValue.strip();
        if (!rawValue.equals(stripped)) {
            throw new IllegalArgumentException("Login identity must not contain boundary whitespace");
        }
        return new LoginIdentifier(stripped.toLowerCase(Locale.ROOT));
    }
}
