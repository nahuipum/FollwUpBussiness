-- A mobile revocation ticket is a single-use credential.  Preserve that
-- invariant at the database boundary so it cannot identify more than one
-- session family, including across tenants.
CREATE UNIQUE INDEX ux_identity_access_session_revocation_ticket_digest
    ON identity_access_session_family (revocation_ticket_digest)
    WHERE revocation_ticket_digest IS NOT NULL;
