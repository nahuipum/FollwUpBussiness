package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.routing.application.port.in.RoutePublicationEligibilityUseCase;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.tenancy.application.port.in.CurrentCompanyQuery;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.DateTimeException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

public final class RoutePublicationEligibilityService implements RoutePublicationEligibilityUseCase {
    private final CurrentCompanyQuery companies;
    private final Clock clock;

    public RoutePublicationEligibilityService(CurrentCompanyQuery companies, Clock clock) {
        this.companies = Objects.requireNonNull(companies);
        this.clock = Objects.requireNonNull(clock);
    }

    @Override
    public Map<UUID, Eligibility> evaluate(List<Route> routes) {
        if (routes == null || routes.isEmpty()) return Map.of();
        Map<UUID, LocalDate> todayByTenant = new LinkedHashMap<>();
        Map<UUID, Eligibility> result = new LinkedHashMap<>();
        for (Route route : routes) {
            if (!"DRAFT".equals(route.status())) {
                result.put(route.id(), new Eligibility(false, Reason.ROUTE_NOT_DRAFT));
                continue;
            }
            LocalDate today = todayByTenant.computeIfAbsent(route.tenantId(), this::currentDate);
            if (today == null) result.put(route.id(), new Eligibility(false, Reason.TENANT_TIMEZONE_UNAVAILABLE));
            else if (route.date().isBefore(today)) result.put(route.id(), new Eligibility(false, Reason.OPERATIONAL_DATE_EXPIRED));
            else result.put(route.id(), new Eligibility(true, Reason.ELIGIBLE));
        }
        return Map.copyOf(result);
    }

    private LocalDate currentDate(UUID tenantId) {
        try {
            return companies.findById(tenantId)
                    .map(company -> LocalDate.ofInstant(clock.instant(), ZoneId.of(company.settings().timezone())))
                    .orElse(null);
        } catch (DateTimeException exception) {
            return null;
        }
    }
}
