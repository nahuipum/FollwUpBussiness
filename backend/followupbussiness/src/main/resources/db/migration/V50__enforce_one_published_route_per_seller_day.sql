CREATE UNIQUE INDEX uq_route_published_seller_day
    ON route (tenant_id, seller_id, operational_date)
    WHERE status = 'PUBLISHED';
