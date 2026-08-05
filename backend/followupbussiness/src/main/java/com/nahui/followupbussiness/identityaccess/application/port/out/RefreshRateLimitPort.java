package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.util.UUID;

public interface RefreshRateLimitPort {
    Decision checkFamily(UUID familyId, String trustedRemoteAddress);

    record Decision(boolean allowed, long retryAfterSeconds) {
    }

    final class UnavailableException extends RuntimeException {
        public UnavailableException() {
            super();
        }
    }
}
