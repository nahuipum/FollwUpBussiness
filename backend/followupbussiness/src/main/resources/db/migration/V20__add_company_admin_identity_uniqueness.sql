CREATE UNIQUE INDEX uq_identity_access_account_company_login
    ON identity_access_account(company_id, login_identifier)
    WHERE company_id IS NOT NULL;

CREATE UNIQUE INDEX uq_identity_access_account_company_email
    ON identity_access_account(company_id, lower(btrim(email)))
    WHERE company_id IS NOT NULL AND email IS NOT NULL;
