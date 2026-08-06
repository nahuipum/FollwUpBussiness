CREATE OR REPLACE FUNCTION audit_purge_network_context(p_before TIMESTAMPTZ, p_batch_size INTEGER) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE deleted_count integer;
BEGIN
  IF p_before IS NULL OR p_before > CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'audit purge cutoff must not be in the future';
  END IF;
  IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 500 THEN
    RAISE EXCEPTION 'audit purge batch size must be between 1 and 500';
  END IF;
  PERFORM set_config('audit.purge', 'true', true);
  WITH expired AS (
    SELECT id FROM audit_network_context
    WHERE occurred_at < p_before
    ORDER BY occurred_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM audit_network_context WHERE id IN (SELECT id FROM expired);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END $$;

CREATE OR REPLACE FUNCTION audit_purge_entries(p_before TIMESTAMPTZ, p_batch_size INTEGER) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE deleted_count integer;
BEGIN
  IF p_before IS NULL OR p_before > CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'audit purge cutoff must not be in the future';
  END IF;
  IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 500 THEN
    RAISE EXCEPTION 'audit purge batch size must be between 1 and 500';
  END IF;
  PERFORM set_config('audit.purge', 'true', true);
  WITH expired AS (
    SELECT id FROM audit_entry
    WHERE occurred_at < p_before
    ORDER BY occurred_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM audit_entry WHERE id IN (SELECT id FROM expired);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END $$;

ALTER FUNCTION audit_purge_network_context(TIMESTAMPTZ, INTEGER) OWNER TO audit_owner;
ALTER FUNCTION audit_purge_entries(TIMESTAMPTZ, INTEGER) OWNER TO audit_owner;
REVOKE ALL ON FUNCTION audit_purge_network_context(TIMESTAMPTZ, INTEGER), audit_purge_entries(TIMESTAMPTZ, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_purge_network_context(TIMESTAMPTZ, INTEGER), audit_purge_entries(TIMESTAMPTZ, INTEGER) TO audit_purger;
