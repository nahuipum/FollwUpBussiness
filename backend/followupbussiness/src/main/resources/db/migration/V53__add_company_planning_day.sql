ALTER TABLE tenancy_company_settings
    ADD COLUMN planning_day_start TIME,
    ADD COLUMN planning_day_end TIME,
    ADD CONSTRAINT ck_company_planning_day_complete CHECK (
        (planning_day_start IS NULL AND planning_day_end IS NULL)
        OR (planning_day_start IS NOT NULL AND planning_day_end IS NOT NULL AND planning_day_start < planning_day_end)
    );
