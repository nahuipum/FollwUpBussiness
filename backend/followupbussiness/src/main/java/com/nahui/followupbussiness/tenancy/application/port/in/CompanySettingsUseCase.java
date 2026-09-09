package com.nahui.followupbussiness.tenancy.application.port.in;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.tenancy.domain.model.Company;
import java.util.Optional;
import java.time.LocalTime;

public interface CompanySettingsUseCase {
    Optional<Company> get(AuthenticatedActor actor);

    Company update(Update command, AuthenticatedActor actor);

    record Update(String timezone, String currency, Integer geofenceRadiusMeters, boolean geofenceRadiusPresent,
                  Integer trackingIntervalSeconds, boolean trackingIntervalPresent,
                  Integer locationRetentionDays, boolean locationRetentionPresent,
                  Integer saleEditWindowMinutes, boolean saleEditWindowPresent,
                  LocalTime planningDayStart, boolean planningDayStartPresent,
                  LocalTime planningDayEnd, boolean planningDayEndPresent, long expectedVersion) {
        public Update(String timezone, String currency, Integer geofenceRadiusMeters, boolean geofenceRadiusPresent,
                      Integer trackingIntervalSeconds, boolean trackingIntervalPresent, Integer locationRetentionDays,
                      boolean locationRetentionPresent, Integer saleEditWindowMinutes, boolean saleEditWindowPresent,
                      long expectedVersion) {
            this(timezone, currency, geofenceRadiusMeters, geofenceRadiusPresent, trackingIntervalSeconds, trackingIntervalPresent,
                    locationRetentionDays, locationRetentionPresent, saleEditWindowMinutes, saleEditWindowPresent,
                    null, false, null, false, expectedVersion);
        }
    }
}
