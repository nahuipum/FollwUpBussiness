package com.nahui.followupbussiness.identityaccess.application.port.out;

import java.util.UUID;

public interface TeamMembershipQuery {
    boolean isSupervisorOf(UUID supervisorId, UUID memberId, UUID tenantId);
}
