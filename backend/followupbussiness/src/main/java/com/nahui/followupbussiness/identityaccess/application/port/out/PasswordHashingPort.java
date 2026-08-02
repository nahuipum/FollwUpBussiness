package com.nahui.followupbussiness.identityaccess.application.port.out;

public interface PasswordHashingPort {

    String hash(char[] rawPassword);

    default boolean matches(char[] rawPassword, String passwordHash) {
        throw new UnsupportedOperationException("Password verification is not configured");
    }
}
