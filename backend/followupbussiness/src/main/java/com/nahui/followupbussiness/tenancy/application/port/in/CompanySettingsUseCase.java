package com.nahui.followupbussiness.tenancy.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import java.util.Optional;

public interface CompanySettingsUseCase {
    Optional<Company> get(AuthenticatedActor actor);

    Company update(Update command, AuthenticatedActor actor);

    record Update(String timezone, String currency, Integer geofenceRadiusMeters, boolean geofenceRadiusPresent,
                  Integer trackingIntervalSeconds, boolean trackingIntervalPresent,
                  Integer locationRetentionDays, boolean locationRetentionPresent,
                  Integer saleEditWindowMinutes, boolean saleEditWindowPresent, long expectedVersion) { }
}
