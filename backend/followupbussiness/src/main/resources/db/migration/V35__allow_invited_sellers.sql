ALTER TABLE workforce_seller DROP CONSTRAINT workforce_seller_status_check;
ALTER TABLE workforce_seller ADD CONSTRAINT workforce_seller_status_check CHECK (status IN ('INVITED','ACTIVE','INACTIVE'));
