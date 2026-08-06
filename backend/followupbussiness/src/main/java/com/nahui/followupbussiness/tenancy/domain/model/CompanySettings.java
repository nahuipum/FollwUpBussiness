package com.nahui.followupbussiness.tenancy.domain.model;

import java.time.ZoneId;
import java.util.Currency;
import java.util.Objects;

public record CompanySettings(String timezone, String currency, int geofenceRadiusMeters, int trackingIntervalSeconds,
                              int locationRetentionDays, Integer saleEditWindowMinutes) {
    public CompanySettings {
        timezone = required(timezone, "timezone", 100);
        currency = required(currency, "currency", 3);
        try { ZoneId.of(timezone); } catch (Exception e) { throw new IllegalArgumentException("timezone is invalid"); }
        try { Currency.getInstance(currency); } catch (Exception e) { throw new IllegalArgumentException("currency is invalid"); }
        if (!currency.matches("[A-Z]{3}")) throw new IllegalArgumentException("currency is invalid");
        if (geofenceRadiusMeters != 100 || trackingIntervalSeconds != 60 || locationRetentionDays != 90)
            throw new IllegalArgumentException("MVP tracking and retention settings are fixed");
        if (saleEditWindowMinutes != null && (saleEditWindowMinutes < 0 || saleEditWindowMinutes > 10080))
            throw new IllegalArgumentException("saleEditWindowMinutes is invalid");
    }
    private static String required(String value, String field, int max) {
        if (value == null || value.isBlank() || value.length() > max) throw new IllegalArgumentException(field + " is invalid");
        return value;
    }
}
