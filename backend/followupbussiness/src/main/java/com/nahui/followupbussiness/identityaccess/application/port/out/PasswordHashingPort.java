package com.nahui.followupbussiness.identityaccess.application.port.out;

public interface PasswordHashingPort {

    String hash(char[] rawPassword);
}
