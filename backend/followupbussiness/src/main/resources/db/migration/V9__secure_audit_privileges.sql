DO $$ BEGIN
    CREATE ROLE audit_owner NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE ROLE audit_writer NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE ROLE audit_purger NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE audit_entry OWNER TO audit_owner;
ALTER TABLE audit_network_context OWNER TO audit_owner;
REVOKE ALL ON audit_entry, audit_network_context FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO audit_writer, audit_purger;
GRANT INSERT ON audit_entry TO audit_writer;

CREATE OR REPLACE FUNCTION audit_reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('audit.purge', true) IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'audit evidence is append-only';
    END IF;
    RETURN OLD;
END $$;
ALTER FUNCTION audit_reject_mutation() OWNER TO audit_owner;
CREATE TRIGGER trg_audit_entry_append_only BEFORE UPDATE OR DELETE ON audit_entry FOR EACH ROW EXECUTE FUNCTION audit_reject_mutation();
CREATE TRIGGER trg_audit_network_append_only BEFORE UPDATE OR DELETE ON audit_network_context FOR EACH ROW EXECUTE FUNCTION audit_reject_mutation();

CREATE OR REPLACE FUNCTION audit_purge_network_context() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE deleted_count integer; BEGIN
  PERFORM set_config('audit.purge', 'true', true);
  WITH expired AS (SELECT id FROM audit_network_context WHERE occurred_at < CURRENT_TIMESTAMP - INTERVAL '90 days' ORDER BY occurred_at LIMIT 500 FOR UPDATE SKIP LOCKED)
  DELETE FROM audit_network_context WHERE id IN (SELECT id FROM expired);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; RETURN deleted_count;
END $$;
CREATE OR REPLACE FUNCTION audit_purge_entries() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE deleted_count integer; BEGIN
  PERFORM set_config('audit.purge', 'true', true);
  WITH expired AS (SELECT id FROM audit_entry WHERE occurred_at < CURRENT_TIMESTAMP - INTERVAL '365 days' ORDER BY occurred_at LIMIT 500 FOR UPDATE SKIP LOCKED)
  DELETE FROM audit_entry WHERE id IN (SELECT id FROM expired);
  GET DIAGNOSTICS deleted_count = ROW_COUNT; RETURN deleted_count;
END $$;
ALTER FUNCTION audit_purge_network_context() OWNER TO audit_owner;
ALTER FUNCTION audit_purge_entries() OWNER TO audit_owner;
REVOKE ALL ON FUNCTION audit_purge_network_context(), audit_purge_entries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_purge_network_context(), audit_purge_entries() TO audit_purger;
