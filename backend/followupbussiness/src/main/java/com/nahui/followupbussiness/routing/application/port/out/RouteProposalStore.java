package com.nahui.followupbussiness.routing.application.port.out;

import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase.Result;

import java.util.*;

public interface RouteProposalStore {
    long nextVersion(UUID tenantId, UUID routeId);

    void save(UUID tenantId, UUID routeId, UUID actorId, UUID territoryId, Result result, String inputHash, String matrixHash);
}
