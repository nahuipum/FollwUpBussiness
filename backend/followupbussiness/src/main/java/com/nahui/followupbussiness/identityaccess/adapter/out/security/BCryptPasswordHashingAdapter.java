package com.nahui.followupbussiness.identityaccess.adapter.out.security;

import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordHashingPort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Arrays;

public final class BCryptPasswordHashingAdapter implements PasswordHashingPort {

    public static final int STRENGTH = 12;

    private final BCryptPasswordEncoder passwordEncoder;

    public BCryptPasswordHashingAdapter() {
        this.passwordEncoder = new BCryptPasswordEncoder(STRENGTH);
    }

    @Override
    public String hash(char[] rawPassword) {
        char[] passwordCopy = rawPassword.clone();
        try {
            return passwordEncoder.encode(new String(passwordCopy));
        } finally {
            Arrays.fill(passwordCopy, '\0');
        }
    }

    @Override
    public boolean matches(char[] rawPassword, String passwordHash) {
        char[] passwordCopy = rawPassword.clone();
        try {
            return passwordEncoder.matches(new String(passwordCopy), passwordHash);
        } finally {
            Arrays.fill(passwordCopy, '\0');
        }
    }
}
