package com.nahui.followupbussiness.routing.application.port.in;

import com.nahui.followupbussiness.routing.domain.Route;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface RoutePublicationEligibilityUseCase {
    Map<UUID, Eligibility> evaluate(List<Route> routes);

    record Eligibility(boolean eligible, Reason reason) { }

    enum Reason {
        ELIGIBLE,
        ROUTE_NOT_DRAFT,
        OPERATIONAL_DATE_EXPIRED,
        TENANT_TIMEZONE_UNAVAILABLE
    }
}
