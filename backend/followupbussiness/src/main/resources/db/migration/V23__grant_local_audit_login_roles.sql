DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_writer_local') THEN
        GRANT audit_writer TO audit_writer_local;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_purger_local') THEN
        GRANT audit_purger TO audit_purger_local;
    END IF;
END $$;
