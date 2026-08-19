# FE-008 — Paquete único de contexto

**Estado:** `READY_FOR_DEVELOPMENT`  
**Candidate-ID:** `HEAD c4bf994 + FE008 085f8866153c`.  
**Alcance:** integrar el listado existente de clientes con Backend, sin commits ni cambios de historias consecuentes.

## Puerta de predecesoras

- `BE-016`: DoF `PASS`; `GET /customers` implementado y validado con alcance de tenant/cartera.
- `BE-060`: DoF `PASS`; cartera vigente habilita el alcance de BE-016.
- `FE-003`: DoF `PASS`; sesión en memoria, revocación y notificación de cambio de identidad disponibles.
- `FE-034`: DoF `PASS`; normalización de errores, `403`, `correlationId` y descarte de solicitudes obsoletas disponibles.

Fuentes verificadas por el Orquestador: `../../docs/handoffs/dof/{BE-016,BE-060}-dof.md`, `../../docs/handoffs/governance/FE-003-dof.md` y `docs/handoffs/governance/FE-034-dof.md`.

## Contrato y decisiones

`../../docs/api/openapi.yaml` define `GET /customers` para `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER`; FE-008 expone web solo a Admin y Supervisor. Parámetros: `page`, `pageSize`, `search`, `status`, `territoryId`, `sellerId`, `segment`, `withoutVisitSince`, `withoutPurchaseSince`. Respuesta `CustomerPage { items, page: PageInfo }`; `Customer` exige `id`, `name`, `status`, `location`, `assignedSellerIds`, timestamps y `version`, con campos opcionales documentales/contacto/dirección/segmento/territorio.

Gap conocido no bloqueante: `Customer` entrega `territoryId` y `assignedSellerIds`, no referencias enriquecidas. No mostrar UUID como etiqueta ni hacer llamadas por fila. Para opciones de filtro se permiten únicamente los contratos aprobados `GET /territories` (`id`, `name`, `code`) y `GET /sellers` (`id`, `displayName`); ambos autorizan Admin/Supervisor. La tabla debe omitir nombres no disponibles y usar solo datos contractuales minimizados (por ejemplo nombre, segmento, cantidad de vendedores y estado). No mostrar documento, teléfono, email, dirección ni coordenadas.

## Invariantes de autorización y seguridad

1. Actor/recurso: Admin consulta clientes de su tenant; Supervisor consulta solo cartera vigente de su equipo. Backend es autoridad incluso con filtros, IDs, fechas y paginación manipulados.
2. Éxito: solo una respuesta `200` vigente actualiza filas, metadata, opciones y hora de actualización; filtros combinados reinician a página 0.
3. Denegación: `403` muestra estado accesible sin conservar/exponer filas, totales, filtros u opciones previas; no hay escritura, evento ni cambio de credenciales.
4. Cambio/fallo: logout o cambio de empresa/identidad invalida solicitudes, limpia lista, filtros, metadata, opciones, errores y cache en memoria; respuestas tardías se ignoran. Un error recuperable no presenta datos antiguos como actuales.
5. Límites: Seller no recibe ruta/navegación nueva. No crear/editar, mapa, historial, importación, duplicados ni asignación. No registrar PII, ubicación, IDs o payloads.

Puertos alcanzables: `GET /customers`; opcionalmente `GET /territories` y `GET /sellers` para etiquetas de filtros; suscripción local a sesión. Sin puertos de escritura.

## Desarrollo y UX

Propiedad principal: `src/features/company-clients/` y sus pruebas. Cambios mínimos permitidos en `src/app/App.tsx`, `src/app/hooks/useSessionRoute.ts`, `src/app/components/CompanyWorkspaceLayout.tsx`, `src/features/auth/auth.ts` y pruebas asociadas solo para habilitar la ruta/navegación de Supervisor. Preservar cambios ajenos ya presentes y reutilizar `DataTable`, paginación, `VisualSelect`, layout y estados FE-034; `company-sellers` es guía, no plantilla para copiar.

No existe `../../docs/frontendMockups/FE-008*.html`; conservar el esqueleto visual actual de `company-clients`. La guía `frontend-mockup-guidance` prohíbe editar mockups como efecto secundario. Adaptar únicamente filtros, cabeceras/celdas y estados exigidos.

Estados: carga inicial; actualización con datos stale claramente marcados; vacío global; cero resultados con limpiar filtros; error recuperable; `403`; paginación real. Accesibilidad: tabla semántica, labels, anuncios de estado/error, controles de paginación y foco estable.

Verificación Development: pruebas focalizadas de API/parser, hook/concurrencia/sesión, tabla/filtros/página y rutas/roles; `npm run typecheck`; por tocar API/sesión/rutas/composición, también `npm run lint`, `npm run build` y regresión pertinente. Handoff único: `docs/handoffs/frontend/FE-008-desarrollo.md` (`READY_FOR_HANDOFF` o `BLOCKED`, máximo 300 palabras).

Artefactos siguientes: `FE-008-qa.md`, `../security/FE-008-seguridad.md`, `../governance/FE-008-dof.md`.
