UPDATE workforce_seller seller
SET status = 'INVITED', updated_at = CURRENT_TIMESTAMP, version = version + 1
FROM identity_access_account account
WHERE seller.user_id = account.id
  AND seller.tenant_id = account.company_id
  AND seller.status = 'ACTIVE'
  AND account.status = 'INVITED';
