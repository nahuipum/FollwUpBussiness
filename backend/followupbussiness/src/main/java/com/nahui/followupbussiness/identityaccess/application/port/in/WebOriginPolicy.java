package com.nahui.followupbussiness.identityaccess.application.port.in;

public interface WebOriginPolicy {
    boolean isAllowed(String origin);
}
