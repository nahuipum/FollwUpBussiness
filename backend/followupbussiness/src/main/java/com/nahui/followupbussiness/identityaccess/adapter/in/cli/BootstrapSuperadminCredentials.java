package com.nahui.followupbussiness.identityaccess.adapter.in.cli;

import com.nahui.followupbussiness.identityaccess.domain.model.LoginIdentifier;

import java.util.Arrays;

public final class BootstrapSuperadminCredentials implements AutoCloseable {

    private final LoginIdentifier loginIdentifier;
    private final char[] password;
    private final String displayName, email;

    BootstrapSuperadminCredentials(LoginIdentifier loginIdentifier, char[] password) {
        this(loginIdentifier,password,null,null);
    }
    BootstrapSuperadminCredentials(LoginIdentifier loginIdentifier, char[] password, String displayName, String email) {
        this.loginIdentifier = loginIdentifier;
        this.password = password.clone();
        this.displayName=displayName; this.email=email;
    }

    public LoginIdentifier loginIdentifier() {
        return loginIdentifier;
    }

    public char[] passwordCopy() {
        return password.clone();
    }
    public String displayName(){return displayName;} public String email(){return email;}

    @Override
    public void close() {
        Arrays.fill(password, '\0');
    }
}
