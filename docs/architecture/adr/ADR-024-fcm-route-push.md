# ADR-024 — FCM para push de rutas

## Decisión

`notifications` implementa `RoutePushGateway` mediante Firebase Admin Java/FCM. El SDK queda en `adapter/out`; aplicación y dominio conservan el puerto. Android e iOS comparten FCM; Mobile se limita a refrescar desde Backend.

## Seguridad y operación

La credencial se resuelve solo por Application Default Credentials del ambiente. No se admiten JSON de cuenta, token ni secreto versionado. `NOTIFICATIONS_FCM_ENABLED=true` sin ADC válida falla al crear el bean; `false` es deshabilitado explícito y nunca confirma entrega. No hay fallback email/SMS.

Transitorios/cuota/timeout reintentan hasta 8 veces, 1 s a 5 min con jitter positivo máximo 25 % y TTL 24 h; inválido/no registrado revoca el binding. Permanente, vencido o agotado se envía a DLQ con diagnóstico saneado.
