package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import jakarta.servlet.http.HttpServletRequest;

/** Applies the same pre-deserialization cap to both unauthenticated recovery endpoints. */
public final class PasswordRecoveryRequestSizeFilter extends LoginRequestSizeFilter {
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equals(request.getMethod())) return true;
        String path = request.getRequestURI();
        return !"/auth/password-recovery-requests".equals(path) && !"/auth/password-resets".equals(path);
    }
}
