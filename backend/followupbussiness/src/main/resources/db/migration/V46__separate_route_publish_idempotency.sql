ALTER TABLE route_idempotency ADD COLUMN operation VARCHAR(20) NOT NULL DEFAULT 'CREATE';
ALTER TABLE route_idempotency DROP CONSTRAINT route_idempotency_pkey;
ALTER TABLE route_idempotency ADD CONSTRAINT route_idempotency_pkey PRIMARY KEY (tenant_id, actor_id, operation, idempotency_key);
