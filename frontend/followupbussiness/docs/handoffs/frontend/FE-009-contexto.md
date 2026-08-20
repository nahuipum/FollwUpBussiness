# FE-009 — Paquete único de contexto

**Estado:** `READY_FOR_QA`  
**Candidate-ID:** `b049d77+7e2ac573`.
**Alcance:** formulario web Admin para crear/editar clientes, ubicación confirmada, advertencia de duplicados y protección de cambios no guardados. Sin commits ni cambios fuera de FE-009.

## Puerta de predecesoras

- `BE-013`, `BE-014` y `BE-015`: DoF `PASS`; están disponibles `POST /customers`, `PATCH /customers/{customerId}` con `If-Match` y `POST /customers/duplicate-checks`.
- `FE-008`: DoF `PASS`; listado Admin/Supervisor, recarga y limpieza de sesión/empresa disponibles en `src/features/company-clients/`.
- `EN-014`: decisión arquitectónica aceptada en `../../docs/architecture/adr/ADR-013-mapas-geocodificacion-navegacion.md`: MapLibre renderiza, Geoapify aporta tiles/estilo, PostGIS/SRID 4326 es autoridad y la geocodificación debe ir por Backend. Sin embargo, el ADR declara que no implementa ni autoriza configuración runtime productiva y que falta la clave Geoapify.

Fuentes verificadas por el Orquestador: historias FE-009/FE-008/EN-014, ADR-013, DoF BE-013/014/015 y artefactos FE-008. No existe `../../docs/frontendMockups/FE-009.html`; la referencia permitida es la composición actual de Clientes y los patrones de diálogo/formulario de Sellers y Administradores/Supervisores, sin modificar mockups.

## Contrato estable verificado

`../../docs/api/openapi.yaml` no presenta diff textual en las superficies consultadas. `POST /customers` exige `name`, `address`, `location`; `PATCH /customers/{customerId}` acepta solo campos de `UpdateCustomerRequest` y requiere `If-Match`; duplicate-check requiere `name` y es informativo. `GET /territories?status=ACTIVE` entrega páginas de `Territory` con `id`, `name`, `code` y estado. `GeoPoint` es WGS 84 con latitud `[-90,90]` y longitud `[-180,180]`. Backend mantiene autoridad de tenant, territorio, duplicados, validación y permisos.

## Invariantes obligatorias

1. Actor/recurso: solo `COMPANY_ADMIN` abre y muta; Supervisor y Seller no reciben controles ni rutas de escritura. Backend rechaza tenant/cliente/territorio ajenos.
2. Éxito: solo `201/200` vigente actualiza FE-008, cierra y limpia formulario/mapa; duplicate-check nunca crea ni simula éxito.
3. Denegación/conflicto: `403/404/409/422` no escriben estado local como éxito; `409` conserva cambios y permite recargar/corregir. No se alteran credenciales/sesión.
4. Cambio/fallo: logout o cambio de empresa invalida requests y limpia formulario, coordenadas, confirmación, duplicados y opciones. Fallo de mapa conserva captura manual accesible y no muestra ubicación vieja como actual.
5. Privacidad: sin PII, coordenadas completas, claves, tenant ni IDs internos en logs/telemetría/proveedor. Ninguna llamada directa de geocodificación desde navegador.

Puertos previstos: `POST /customers`, `GET/PATCH /customers/{customerId}`, `POST /customers/duplicate-checks`, `GET /territories` y suscripción local de sesión. No existe puerto Backend aprobado de geocodificación en el alcance consultado.

## Decisión de desbloqueo y configuración del mapa

El usuario autorizó instalar MapLibre y delegó la degradación MVP. La variable existente `FOLLOW_UP_BUSSINESS_GEOAPIFY_SPIKE_KEY` es server-side y exclusiva del spike definido por ADR-013: no debe leerse, copiarse ni exponerse en Vite. El canal web usará `VITE_GEOAPIFY_TILE_KEY` en `frontend/followupbussiness/.env` (ignorado por Git), documentada sin valor en `.env.example`, como token público restringido a tiles/origen/ambiente. No se implementará geocodificación.

Estados MVP: `ACTIVE` solo cuando exista configuración de tiles y el mapa cargue; `LIMITED` cuando MapLibre esté disponible pero tiles/red/proveedor fallen, con error, atribución y reintento manual; `DISABLED` cuando falte configuración. Todos conservan dirección y coordenadas editables, validación WGS 84 y confirmación explícita. Nunca se simulan resultados ni se usa el mapa como única entrada accesible.

Development puede instalar `maplibre-gl` y modificar únicamente `package.json`/lockfile y responsabilidades reales de `company-clients`, reutilizando sesión, API y `ModalSurface`. Debe preservar el worktree concurrente, no modificar mockups ni archivos ajenos, y no hardcodear o registrar claves/PII/coordenadas. Ejecutar pruebas focalizadas, typecheck, lint y build por cambiar dependencia, API y composición.

## Resultado de la única revalidación QA

La remediación cerró por código la inicialización `ACTIVE`, degradación `LIMITED`/reintento, modo `DISABLED` y la confirmación/revocación explícita del punto. QA mantiene `CHANGES_REQUIRED` porque la suite conserva solo cinco pruebas previas de tabla y no aporta evidencia automatizada reproducible de esos flujos asíncronos ni del bloqueo/doble envío.

**Condición de cierre:** añadir pruebas de `ClientLocationMap` con MapLibre simulado (`load`, `error`, reintento y ausencia de clave) y de `ClientFormDialog` (confirmar, modificar o arrastrar, revocar confirmación, bloquear submit y doble envío), ejecutarlas en la suite focalizada y obtener `PASS` QA.

El usuario reanudó explícitamente el flujo. Se verificó sin revelar el valor que `frontend/followupbussiness/.env` contiene una única `VITE_GEOAPIFY_TILE_KEY` no vacía/no placeholder, con formato plausible, consumida por el componente y excluida por Git. Esta comprobación no valida restricciones del panel ni llama al proveedor. La remediación reabierta es exclusivamente de pruebas; no autoriza cambios productivos.

## Delta posterior al DoF anterior

La prueba manual detectó `GET /territories?status=ACTIVE?page=0&pageSize=100` (`400`). Development corrigió la composición paginada para conservar queries existentes con `&`, incluidas páginas posteriores, y preservó el `code` real del territorio. El candidato cambió; los veredictos QA/Seguridad/DoF con `b049d77+ca5ebb0b` no certifican esta versión. QA debe revalidar el fix focalizado antes de reabrir las compuertas siguientes.

Una segunda prueba manual mostró la alerta de mosaicos durante la carga normal. El style Geoapify respondió `200` en una única verificación sanitizada; la causa era que `LIMITED` representaba simultáneamente carga y fallo. Se añadió `LOADING`; la alerta queda reservada para errores reales. Este cambio integra el candidato actual y también requiere QA.

La prueba posterior detectó que MapLibre 6 buscaba su worker en el prebundle inexistente de Vite 8. El candidato actual excluye `maplibre-gl` de `optimizeDeps` y configura el worker mediante `?worker&url`, siguiendo la integración oficial de Vite. El build emite el worker autocontenido; no se cambia proveedor ni credencial.

## Decisión MVP de ubicación

El usuario autorizó el alcance sin geocodificación: Lima es únicamente viewport de referencia cuando no hay punto; latitud/longitud permanecen vacías y no confirmadas. Clic o arrastre del marcador, o captura manual, seleccionan coordenadas y revocan cualquier confirmación previa. El checkbox y el submit permanecen deshabilitados mientras el punto sea vacío/inválido. La UI informa que buscar por dirección no está disponible; React no llama a Geoapify Geocoding. Un puerto Backend neutral queda diferido a otra historia/contrato.

## Delta visual del candidato actual

El formulario fue homologado con el patrón vigente de Sellers: superficie, cabecera, secciones, campos, selector, botones, espaciado, responsive, foco y confirmación de descarte. Error operativo, duplicados y éxito se presentan en popups accesibles reutilizables; el fallo de mosaicos permanece contextual dentro del mapa para evitar abrir diálogos repetidos por eventos de tiles y conserva reintento/captura manual. No se modificaron mockups ni reglas, contratos, permisos o integración externa. Este delta cambia el Candidate-ID y requiere QA focalizada antes de Seguridad/DoF.

La única corrección QA conectó el foco inicial de `ModalSurface`: el formulario enfoca Nombre y los popups su acción principal; Tab/Shift+Tab, Escape, exclusión de controles deshabilitados y retorno al disparador quedaron cubiertos. No cambió la superficie sensible. QA y Seguridad emitieron `PASS` para `b049d77+5fbf78f9`.

## Delta actual: creación con respuesta contractual

`parseClient` normaliza `segment` y `territoryId` ausentes o nulos a `null`, sin relajar los campos requeridos. `POST/PATCH` devuelven su `Customer` parseado; el formulario exige exactamente `201/200` según operación y cuerpo válido antes de limpiar, recargar y anunciar éxito. Un `201` malformado conserva el formulario y muestra error. Se añadieron pruebas de transporte/listado y hook. Requiere QA focalizada; no cambia contrato, permisos, sesión ni Backend.

## Delta actual: campos opcionales contractuales

El formulario Admin incorpora tipo/número de documento, teléfono, email, segmento y frecuencia de visita, con límites accesibles y diseño responsive. `ClientFormInput` y `ClientFormTarget` modelan los campos; el detalle normaliza `null`/ausentes a vacío, y POST/PATCH omiten valores vacíos o frecuencias fuera de 1–365. Se conserva mapa WGS84, confirmación, permisos, limpieza de sesión/empresa y doble envío. Requiere QA focalizada.

## Delta actual: identidad y duplicados contractuales

El selector accesible usa `DNI`, `RUC`, `CE` y vacío; limpia el número al cambiar, solo admite dígitos y exige 8/11/9 respectivamente. Teléfono exige `^9\\d{8}$`; email opcional informa error accesible. El submit se bloquea ante opcionales presentes inválidos. Duplicate-check envía nombre, dirección, número/teléfono disponibles, WGS84 y `excludeCustomerId` en edición; acepta únicamente `{hasPossibleDuplicates,candidates:[{customer,score,matchedFields}]}` válido. Un fallo de formato o red muestra error y no presenta cero coincidencias; la advertencia informativa jamás bloquea guardar. Sin cambios de contrato, Backend, permisos, sesión/empresa, mapa o mockups.

## Delta actual: posición y disponibilidad de comprobación

`Comprobar duplicados` se trasladó a un bloque secundario después de la ubicación (mapa y confirmación) y justo antes del footer. Comunica que es informativo y guardar no depende de ejecutarlo. Solo se habilita con nombre/dirección válidos, opcionales presentes válidos, frecuencia válida, WGS84 válido y confirmado, sin mutación en curso. El handler elimina el fallback `0,0`: no invoca el contrato sin coordenadas reales. Pruebas cubren orden DOM, confirmación, criterios y creación sin comprobación. Sin cambios de API, hooks, Backend, proveedor, permisos, sesión/empresa o mockups.
