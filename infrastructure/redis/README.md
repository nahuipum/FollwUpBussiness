# Redis

## Usos

- Última ubicación.
- Presencia.
- Cache.
- Rate limits.
- Idempotencia temporal.
- Locks con TTL.

## Claves

`fs:{tenantId}:tracking:seller:{sellerId}`  
`fs:{tenantId}:idempotency:{operation}:{key}`  
`fs:{tenantId}:cache:{domain}:{resource}`

Redis no es fuente de verdad y no se expone públicamente.
