# ADR-016 — Privacidad, retención y rastreo de ubicación

- **Estado:** Aceptado por decisión de Producto, Legal/Privacidad y Seguridad; pendiente de validación independiente en las historias implementadoras.
- **Fecha:** 2026-07-31
- **Historia:** EN-016
- **Responsable de la decisión:** Luis Siancas (Producto, Legal/Privacidad y Seguridad)
- **Ámbitos propietarios:** `journeys`, `tracking`, `visits`, Mobile y administración.

## Contexto

RN-020, RF-UBI-008, RNF-006..008 y la sección 17 exigen limitar el rastreo a
la jornada, controlar acceso y definir retención. Las decisiones 7, 8 y 15
estaban abiertas e impedían implementar jornada, tracking, geocerca, mapa e
historial. PostgreSQL es la fuente de verdad del historial, Redis solo estado
efímero y la cola local no puede perder una muestra pendiente.

Esta decisión fija la política del MVP; no crea endpoints, jobs, tablas,
pantallas ni captura en segundo plano.

## Alineación con ADR-015

Por instrucción de Luis Siancas — Owner, el ciclo de vida local de comandos
pendientes se homologa a ADR-015. ADR-016 conserva la autoridad sobre
privacidad, validez, frecuencia y retención de ubicaciones; ADR-015 define el
flujo operativo de sincronización, exportación autorizada y limpieza de un
ámbito local. Esta alineación no autoriza descartar pendientes ni altera la
purga física de ubicaciones aceptadas.

## Decisión

### D1 — Calidad y uso geográfico (opción A)

- Radio de geocerca: **100 m**.
- Una muestra es utilizable solo con `accuracyMeters <= 50 m` y con
  `capturedAt` de antigüedad máxima **5 min** al ser evaluada por el servidor.
- La geocerca se valida exclusivamente en backend/PostGIS. Mobile puede
  anticipar UX, pero nunca habilita definitivamente una visita.

### D2 — Frecuencia y ventana de captura (opción A)

- Frecuencia fija del MVP: **una muestra cada 60 s**, únicamente mientras la
  jornada está activa.
- El servicio móvil se inicia tras jornada activa y se detiene al cerrarla, al
  cierre administrativo, **siempre al logout** o revocación de permiso, según
  RN-020. El indicador de rastreo debe ser visible mientras esté activo.

### D3 — Muestra inválida o capacidad degradada (opción A)

Una muestra sin coordenadas válidas, con precisión mayor de 50 m, antigüedad
mayor de 5 min o recibida sin jornada activa se rechaza: **no se persiste, no se
publica, no actualiza Redis y no se usa en geocerca**. Se registra solamente un
evento técnico sanitizado (tipo de fallo, instante, ámbito técnico,
`correlationId` si existe), sin latitud/longitud ni payload. La app muestra
estado degradado y una acción recuperable para permiso, GPS, servicio o batería;
no simula que el tracking continúa. No hay sanción automática.

“No se persiste” significa que no crea historial de ubicación, cache, Redis ni
proyección. El envelope admite un rango técnico seguro de precisión 0..10000
para poder responder por muestra: `accuracyMeters >50` es inválida de negocio y
queda `REJECTED/LOCATION_ACCURACY_EXCEEDED` sin abortar las demás del lote. Una
cola local cifrada puede conservarla solo como pendiente hasta ese acuse y debe
eliminarla al resolver; no se convierte en ubicación aceptada.

### D4 — Retención y ciclo de vida (opción A)

| Soporte | Dato | Regla |
|---|---|---|
| PostgreSQL/PostGIS | historial exacto aceptado | 90 días desde `min(capturedAt, receivedAt)`; purga física al vencer |
| Redis | última ubicación | TTL máximo 15 min; clave con tenant y vendedor; nunca fuente de verdad |
| Dispositivo | muestra/cola pendiente | cifrada y segregada por tenant/usuario; conservar hasta confirmación o resolución autorizada |
| Logs/métricas/evento técnico | telemetría | sin coordenadas completas, payload ni identificadores personales expuestos |

La purga es física para ubicaciones aceptadas vencidas, incluidas réplicas y
proyecciones de tracking. Consultas e índices excluyen vencidos. Redis vence por
TTL, se invalida al cerrar jornada o revocar acceso y no se repuebla desde datos
vencidos. La cola local no se purga por tiempo mientras exista pendiente:
confirmación o resolución explícita es la condición de salida. Un borrado lógico
de negocio no sustituye la purga física ni autoriza borrar visitas o ventas.

### D5 — Acceso mínimo necesario (opción A)

- `SELLER`: solo su propia jornada/estado y no un histórico administrativo.
- `SUPERVISOR`: última ubicación e histórico exclusivamente de vendedores de su
  equipo vigente y del mismo tenant.
- `COMPANY_ADMIN`: datos de su tenant; no acceso de plataforma cruzado.
- `PLATFORM_SUPERADMIN`: no obtiene acceso operativo a ubicaciones de empresas
  por el rol base. Soporte excepcional requiere caso autorizado, alcance/tiempo
  mínimo, autorización por recurso y auditoría, definidos fuera de EN-016.

El tenant, identidad, rol, equipo y recurso se derivan/validan en servidor;
ningún `tenantId`, `sellerId` o filtro recibido del cliente concede acceso.

### D6-D8 — Consentimiento, eliminación y transparencia (opción A)

- **D6:** sin permiso, GPS o servicio disponible no se inicia tracking ni visita
  geolocalizada; su revocación lo suspende inmediatamente y muestra estado
  degradado recuperable. El logout siempre detiene tracking.
- **D7:** la solicitud de eliminación sigue proceso administrativo manual,
  auditable y aprobado por Legal. Aplica borrado lógico donde corresponda a
  entidades de negocio; las ubicaciones se purgan físicamente al vencer D4.
- **D8:** indicador persistente durante tracking, explicación previa a pedir
  permiso y auditoría de cambios de política, consultas sensibles, soporte
  excepcional y solicitudes de eliminación; esas evidencias no contienen
  coordenadas.

### D9 — Reloj futuro (opción A)

El servidor admite como máximo **2 min** de adelanto de `capturedAt` respecto de
su reloj al recibir la muestra. Un adelanto mayor queda
`REJECTED/LOCATION_TIMESTAMP_IN_FUTURE`, sin historial, Redis, WebSocket,
geocerca ni visita. El vencimiento se calcula con
`min(capturedAt, receivedAt) + 90 días`; un timestamp cliente nunca extiende la
retención. Replay y concurrencia conservan el mismo rechazo.

### D10 — Cadencia y abuso (opción A)

Se acepta como máximo una muestra por ventana UTC de 60 s de `capturedAt` por
tenant, usuario y jornada. La primera válida gana atómicamente; extras quedan
`REJECTED/LOCATION_FREQUENCY_EXCEEDED` sin efectos. Los lotes offline son
válidos y pueden cubrir varias ventanas. Además existe presupuesto/rate-limit
por tenant+usuario+jornada, agregado entre dispositivos; excederlo devuelve
`429 LOCATION_RATE_LIMITED` con `Retry-After`. Contadores y alertas distinguen
ráfaga/multi-device sin coordenadas, payload ni sanción automática.

### D11 — Señal de ubicación simulada (opción A)

`mocked=true` queda `REJECTED/LOCATION_MOCKED` para tracking y geocerca. Si
`mocked` está ausente, la integridad es `UNKNOWN`: puede conservarse como punto
de tracking si cumple las demás reglas, pero no habilita una visita
geolocalizada; geocerca responde `LOCATION_INTEGRITY_UNKNOWN`. `mocked=false`
es una declaración del cliente, no prueba infalible. Estas señales nunca
generan sanción automática; la futura detección adicional requiere revisión.

### D12 — Copias y borrado efectivo (opción A)

Los 90 días incluyen copias y remanencia:

- claves de backup segmentadas por ámbito/periodo y crypto-erasure al vencer;
- base/clave y cola excluidas de backups del sistema operativo móvil;
- backup restaurado entra en cuarentena, sin consultas ni publicación, y se
  purga antes de habilitarlo;
- tras acuse/resolución Mobile elimina la fila, compacta/limpia páginas según el
  motor y rota/destruye la clave de ámbito cuando corresponda;
- no se reutiliza una clave que permita recuperar páginas o copias vencidas.

## Contratos futuros y límites

OpenAPI, WebSocket y eventos son superficies futuras: BE-028/029/032/034/054,
FE-020/022 y MOB-003/026/030 deberán adoptar esta política y publicar sus
contratos finales con revisión Backend, Mobile y QA. Una muestra rechazada solo
expone código estable (`LOCATION_ACCURACY_EXCEEDED`, `LOCATION_TOO_OLD`,
`LOCATION_TIMESTAMP_IN_FUTURE`, `LOCATION_FREQUENCY_EXCEEDED`,
`LOCATION_MOCKED`, `TRACKING_INACTIVE` o `LOCATION_UNAVAILABLE`), nunca
coordenadas. El evento
técnico degradado no es `seller.location.updated` y no lleva ubicación.

`docs/sync/location-offline-contract.md` define el protocolo futuro de la cola
de ubicaciones, separado de `mobile-sync/v1`: segregación local, lote, acuse,
resolución, limpieza segura, autoridad derivada de sesión e idempotencia por
muestra. Repetir o concurrir una muestra inválida conserva `REJECTED` y solo
deduplica telemetría técnica sanitizada; `DUPLICATE` se reserva a una ubicación
previamente aceptada con el mismo fingerprint.

El acuse REST devuelve exactamente un resultado por `clientEventId`, en el
mismo orden del request. La variante `REJECTED` exige un `errorCode` estable y
sanitizado; ninguna variante de resultado transporta coordenadas. RN-020 no
admite configuración que mantenga tracking tras logout: siempre se detiene.

La guarda de lote precede a cualquier guarda por muestra. Un replay exacto del
mismo binding de tenant/owner/jornada/clave/batch/dispositivo/fingerprint
ordenado devuelve el acuse original con sus statuses originales y no reprocesa;
un binding igual pero distinto devuelve
`LOCATION_BATCH_IDEMPOTENCY_CONFLICT` sin mutación. Solo un lote lógico nuevo
consulta la guarda por muestra y puede devolver `DUPLICATE` para un
`clientEventId` previamente aceptado.

El histórico no se presenta como vivo; Redis o WebSocket caídos degradan la
vista, no habilitan datos antiguos como actuales. Modificar radio, precisión,
antigüedad, frecuencia o retención exige ADR sustituto y revisión de
Seguridad/Legal.

## Operación, purga y rollback

- INT-031 implementará job idempotente y medible que purga por lotes acotados,
  seleccionado por `tenantId` y vencimiento calculado desde
  `min(capturedAt, receivedAt)`, con métricas saneadas. Debe cubrir tablas,
  proyecciones, cache, copias y crypto-erasure de claves segmentadas.
- La restauración de backup no puede reintroducir ubicaciones vencidas: antes de
  exponerlo se ejecuta la misma purga y se conserva evidencia.
- Una solicitud de eliminación aplica D7: proceso manual, auditable y aprobado
  por Legal; D4 se aplica a ubicaciones y el flujo de borrado lógico autorizado
  a entidades de negocio. No promete plazo para visitas, ventas o auditoría.
- Rollback: desactivar captura/publicación futura, detener servicio móvil y
  expirar Redis; no restaurar ni prolongar ubicaciones purgadas. Si se detiene
  el job, consultas siguen filtrando vencidos y se alerta hasta recuperarlo.

## Dependencias, fuera de alcance y riesgos

Desbloquea BE-028, BE-029, BE-032, BE-034, BE-054, FE-020, FE-022, MOB-003,
MOB-026, MOB-030 e INT-031. Cada historia conserva sus pruebas de autorización,
tenant, permisos, offline, degradación y contrato.

Al logout o cambio de tenant/usuario, Mobile detiene la captura, invalida el
contexto de clave y trata cache, datos y cola del ámbito anterior conforme
ADR-015: antes de limpiar ofrece sincronización o exportación únicamente por
un flujo autorizado. La limpieza requiere que ese flujo termine con una
disposición autorizada y trazable del pendiente; nunca se descarta de forma
silenciosa. Si no puede completarse, el ámbito queda bloqueado en estado seguro,
sin captura ni acceso a sus datos, hasta completar el flujo autorizado.

Retención de **visitas y ventas**: fuera de EN-016; responsable Luis Siancas,
cierre **2026-08-14**. Política detallada de auditoría y contador D6: fuera de
EN-016; responsable Luis Siancas, cierre **2026-08-21**. El contador futuro
distinguirá fallos técnicos de acciones deliberadas, no contendrá coordenadas y
no generará sanciones automáticas. Esta aceptación humana no sustituye revisión
legal ni de seguridad independiente sobre la implementación.

Riesgos residuales: permisos/GPS/batería pueden impedir captura; una cola
offline puede crecer hasta resolverse; backup/restore y réplicas pueden
reintroducir datos si INT-031 no los cubre. No se autoriza cerrar esos riesgos
sin evidencia independiente de QA y Ciberseguridad.
