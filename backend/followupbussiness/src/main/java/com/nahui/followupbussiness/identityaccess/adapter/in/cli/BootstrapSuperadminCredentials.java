package com.nahui.followupbussiness.identityaccess.adapter.in.cli;

import com.nahui.followupbussiness.identityaccess.domain.model.LoginIdentifier;

import java.util.Arrays;

public final class BootstrapSuperadminCredentials implements AutoCloseable {

    private final LoginIdentifier loginIdentifier;
    private final char[] password;

    BootstrapSuperadminCredentials(LoginIdentifier loginIdentifier, char[] password) {
        this.loginIdentifier = loginIdentifier;
        this.password = password.clone();
    }

    public LoginIdentifier loginIdentifier() {
        return loginIdentifier;
    }

    public char[] passwordCopy() {
        return password.clone();
    }

    @Override
    public void close() {
        Arrays.fill(password, '\0');
    }
}
