package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.util.UUID;

public interface ResourceAccessGrantQuery {
    boolean hasAccess(UUID accountId, UUID tenantId, String resourceType, UUID resourceId);
}
