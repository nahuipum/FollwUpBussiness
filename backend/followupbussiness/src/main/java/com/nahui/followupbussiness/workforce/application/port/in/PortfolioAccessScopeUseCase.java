package com.nahui.followupbussiness.workforce.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import java.util.Set;
import java.util.UUID;

/** Public workforce boundary: resolves the current seller portfolio reachable by an authenticated actor. */
public interface PortfolioAccessScopeUseCase {
    Scope resolve(AuthenticatedActor actor);

    record Scope(UUID tenantId, boolean allCurrentPortfolios, Set<UUID> sellerIds) { }
    final class Forbidden extends RuntimeException { }
}
