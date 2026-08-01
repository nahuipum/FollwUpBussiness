# EN-016 — Matriz de criterios a evidencia

**Estado:** preparada para implementación y revisión independiente; no acredita
por sí misma aprobación legal ni de seguridad de código futuro.

| CA | Decisión/evidencia documental | Evidencia exigida al implementar | Historia responsable |
|---|---|---|---|
| 1. Tracking solo en jornada | ADR-016 D2, D6; RN-020; RF-UBI-008 | inicio/cierre, cierre administrativo, logout, revocación y ausencia de envío/servicio tras cierre | BE-028, BE-033, MOB-026, INT-023 |
| 2. Frecuencia, precisión, antigüedad e inválidas | ADR-016 D1-D3; OpenAPI; `location-offline/v1` | 60 s, 50 m, 5 min, rechazo repetido/concurrente determinista sin DB/Redis/WebSocket/geocerca y acuse por muestra | BE-029, BE-034, BE-054, MOB-009, MOB-030 |
| 3. Retención y acceso | ADR-016 D4-D5; REST/WS `tracking/v1` | TTL Redis <=15 min; denegación cross-tenant/equipo; TrackPoint aceptado con receivedAt; histórico fecha/visitas/paginación | BE-030, BE-032, FE-020, FE-022 |
| 4. Permiso, GPS y batería | ADR-016 D3, D6 | rechazo/revocación, GPS/batería desactivados, estado degradado y acción recuperable; telemetría sin coordenadas | MOB-003, MOB-030 |
| 5. Aviso, soporte y eliminación | ADR-016 D7-D8 | indicador, explicación previa, auditoría saneada, proceso Legal y purga física; cola solo hasta resolución | MOB-026, INT-031 |
| 6. Responsables | ADR-016 encabezado y pendientes | revisión independiente Legal/Privacidad y Ciberseguridad del diff implementado | Seguridad, DoF |

## Casos obligatorios para INT-031

1. Crear ubicación aceptada y confirmar que antes de 90 días se consulta solo
   desde tenant/rol/equipo autorizado.
2. Ejecutar purga sobre datos vencidos y comprobar borrado físico en historial,
   proyecciones y cache, con métrica saneada; repetir el job sin efecto adicional.
3. Restaurar backup con dato vencido, purgar antes de reexponer y confirmar que
   no vuelve a Redis/WebSocket.
4. Mantener una muestra offline válida hasta acuse o resolución; no conservar
   una inválida. Logout/cambio de ámbito detiene captura y bloquea el ámbito si
   el pendiente no puede resolverse autorizadamente, sin descarte silencioso.
5. Repetir y enviar concurrentemente el mismo `clientEventId`: una muestra
   válida produce un `ACCEPTED` y luego `DUPLICATE`; una inválida conserva
   `REJECTED`; payload distinto produce `IDEMPOTENCY_CONFLICT`.
   Todo `REJECTED` incluye `errorCode` estable y el acuse contiene exactamente
   un resultado por muestra, en el mismo orden y sin coordenadas.
6. Validar WS por tenant/recurso, envelope/version/orden, descarte de duplicado o
   mensaje antiguo, recuperación ante gap y ausencia total de muestras inválidas.
7. Validar FE-022 por vendedor/fecha, puntos de visita paginados, límite 200 y
   denegación de equipo/tenant no autorizado.
8. Validar que logout siempre detiene captura y tracking, sin flag o
   configuración capaz de mantenerlo activo.
9. Enviar un lote estructuralmente válido mezclando precisiones <=50 y >50 (hasta
   10000): las primeras siguen su resultado normal; cada >50 obtiene
   `REJECTED/LOCATION_ACCURACY_EXCEEDED`; el lote no falla completo y ninguna
   rechazada aparece en historial/cache/Redis/WebSocket/geocerca.
10. D9: probar `capturedAt` en borde +2 min, por encima, futuro lejano, replay y
    concurrencia; el exceso queda `LOCATION_TIMESTAMP_IN_FUTURE` sin efectos y
    el vencimiento nunca supera `min(capturedAt, receivedAt)+90 días`.
11. D10: concurrir muestras/lotes/dispositivos en una ventana UTC de 60 s; solo
    una aceptada, extras `LOCATION_FREQUENCY_EXCEEDED`; ventanas offline
    distintas válidas y abuso agregado produce 429 sin coordenadas.
12. D11: `mocked=true` queda `LOCATION_MOCKED`; ausente queda `UNKNOWN` y no
    habilita visita/geocerca; verificar que no existe sanción automática.
13. D12: verificar backup móvil excluido, claves segmentadas/crypto-erasure,
    restore en cuarentena y purga, eliminación/compactación tras acuse y cambio
    de ámbito sin remanencia recuperable.
14. SEC-EN016-002: durante publicación/snapshot probar logout, revocación,
    cambio de rol/equipo/tenant/recurso y cierre administrativo; cerrar
    fail-closed, cancelar carrera, limpiar FE y prohibir reconexión/snapshot.
15. SEC-EN016-006: reusar Idempotency-Key/batchId con mismo binding devuelve el
    mismo acuse con statuses originales, sin reprocesar ni convertir ACCEPTED a
    DUPLICATE; cambiar contexto/device/conjunto/orden da
    `LOCATION_BATCH_IDEMPOTENCY_CONFLICT` sin mutación. Mobile rechaza acuses con
    cardinalidad, IDs u orden inconsistentes y no limpia la cola. Un lote nuevo
    que repite un clientEventId previamente aceptado sí devuelve DUPLICATE.

## Comandos de evidencia documental

```powershell
rg -n 'ADR-016|60 s|50 m|5 min|90 días|15 min' docs 00_CONTRATO_FUNCIONAL.md
git diff --check
```

Las historias ejecutoras registrarán sus comandos dirigidos (JUnit/Maven,
Flutter y E2E) con commit o diff revisable. EN-016 es documental y no ejecuta
tests de runtime.
