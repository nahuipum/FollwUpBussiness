package com.nahui.followupbussiness.identityaccess.application.port.out;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import java.util.UUID;
public interface AccessTokenPort { String issue(UUID accountId, UUID sessionId, UUID companyId, BaseRole role); }
