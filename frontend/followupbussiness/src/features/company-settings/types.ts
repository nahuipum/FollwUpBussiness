export type CompanySettings = Readonly<{
  timezone: string;
  currency: string;
  geofenceRadiusMeters: 100;
  trackingIntervalSeconds: 60;
  locationRetentionDays: 90 | null;
  saleEditWindowMinutes: number | null;
}>;

export type CompanySettingsSnapshot = Readonly<{ settings: CompanySettings; etag: string }>;
export type UpdateCompanySettingsInput = Readonly<{ currency: string; saleEditWindowMinutes: number | null }>;
