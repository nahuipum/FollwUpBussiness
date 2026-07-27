# Catálogo de claves Redis

| Patrón | Valor | TTL |
|---|---|---|
| fs:{tenant}:tracking:seller:{seller} | última ubicación y estado | minutos |
| fs:{tenant}:idempotency:{type}:{uuid} | resultado resumido | horas/días |
| fs:{tenant}:rate:{subject}:{window} | contador | ventana |
| fs:{tenant}:cache:{domain}:{id} | proyección | corto |
