package com.nahui.followupbussiness.routing.application;

import com.nahui.followupbussiness.routing.application.port.in.RoutePublicationEligibilityUseCase;
import com.nahui.followupbussiness.routing.domain.Route;
import com.nahui.followupbussiness.tenancy.application.port.in.CurrentCompanyQuery;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import com.nahui.followupbussiness.tenancy.domain.model.CompanySettings;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RoutePublicationEligibilityServiceTest {
    @Test
    void distinguishesExpiredDraftUsingTenantTimezoneWithoutChangingPersistedStatus() {
        UUID tenant = UUID.randomUUID();
        CurrentCompanyQuery companies = mock(CurrentCompanyQuery.class);
        CompanySettings settings = new CompanySettings("America/Lima", "PEN", 100, 60, 90, null, null, null);
        when(companies.findById(tenant)).thenReturn(Optional.of(new Company(tenant, "Legal", "Trade", "code", "tax", CompanyStatus.ACTIVE, settings, Instant.EPOCH, Instant.EPOCH, 1)));
        var service = new RoutePublicationEligibilityService(companies, Clock.fixed(Instant.parse("2026-10-02T04:30:00Z"), ZoneOffset.UTC));
        Route expired = route(tenant, LocalDate.of(2026, 9, 30), "DRAFT");
        Route todayInLima = route(tenant, LocalDate.of(2026, 10, 1), "DRAFT");

        var result = service.evaluate(List.of(expired, todayInLima));

        assertThat(result.get(expired.id())).isEqualTo(new RoutePublicationEligibilityUseCase.Eligibility(false, RoutePublicationEligibilityUseCase.Reason.OPERATIONAL_DATE_EXPIRED));
        assertThat(result.get(todayInLima.id())).isEqualTo(new RoutePublicationEligibilityUseCase.Eligibility(true, RoutePublicationEligibilityUseCase.Reason.ELIGIBLE));
        assertThat(expired.status()).isEqualTo("DRAFT");
    }

    private static Route route(UUID tenant, LocalDate date, String status) {
        return new Route(UUID.randomUUID(), tenant, null, date, UUID.randomUUID(), null, List.of(), Instant.EPOCH, Instant.EPOCH, 1, status);
    }
}
