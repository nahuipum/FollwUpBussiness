# Contexto — migración visual del shell y dashboard de empresa

## Estado

- Fase autorizada: DoF, tras Development `READY_FOR_HANDOFF`, QA de revalidación `PASS` y Security `NOT_APPLICABLE`.
- Candidate-ID: `HEAD ceb2c20 + diff 5c6d91e6a0a4`.

Digest reproducible: SHA-256 truncado a 12 hex de la concatenación binaria de contenidos en el orden documentado por QA. Conjunto exacto de 25 paths: layouts de Company y Platform; página/CSS/test del dashboard; layout/CSS/test del shell; primitivas TSX/CSS/test; `global.css`, `theme.css`; specs visuales del shell y tema; y los diez PNG del shell, incluido Rutas. No incluye artifacts Markdown.
- Referencia visual exacta: `docs/frontendMockups/_golden-company-dashboard.html`.
- Fuentes consultadas por el Orchestrator: `docs/design/visual-system.md`, `docs/frontendMockups/_design-system.html`, `docs/frontendMockups/_application-shell.html`, `docs/frontendMockups/_golden-clients.html`, `docs/frontendMockups/_golden-routes.html`.
- Los mockups son solo referencia visual y no deben modificarse ni cargarse desde producción.

## Objetivo y alcance

Migrar el shell reutilizable de páginas autenticadas y completar `/company/dashboard` con encabezado, contexto de empresa proveniente de la sesión existente, accesos rápidos a rutas ya existentes y un estado informativo del futuro resumen operativo. No agregar fetch, hooks de negocio, estado global, APIs, métricas ni datos presentados como reales. FE-030 y `/reports/daily-dashboard` quedan fuera.

Rutas de trabajo principales: `DashboardLayout.tsx` y su CSS/pruebas; layouts de empresa/plataforma; `CompanyDashboardPage.tsx`, CSS y pruebas; componentes presentacionales compartidos y tokens productivos solo si aportan reutilización clara; una prueba visual específica del shell.

## Regiones y comportamientos protegidos

1. Sesión, autenticación, logout, permisos, capacidades, contratos, clientes API, rutas API, Backend, hooks de negocio, cache y aislamiento de tenant.
2. Navegación por workspace, empresa, supervisor y plataforma; rutas actuales, secciones por rol, item activo, grupo Clientes, expansión/cierre, navegación móvil y cierre tras navegar.
3. Backdrop móvil; breadcrumbs; perfil y menú; Escape; devolución de foco; tema claro/oscuro y persistencia; `aria-current`, `aria-expanded`, `aria-controls` y labels accesibles.
4. Auditoría conserva su estado vigente o aparece inaccesible de forma semántica; no se crea ruta.
5. Cambios locales existentes en `features/auth/**`, pruebas de login/recuperación, sus specs/snapshots y `followup-logo.png`: preservar sin revertir, sobrescribir o reformatear.

## Decisiones visuales

- Sidebar de referencia de 252 px, topbar de 72 px, contenido máximo de 1240 px y breakpoints de capacidad en 1060/620 px.
- Usar el logo productivo ya incorporado y `lucide-react`; no usar emojis, SVG del mockup, `golden-system.css` ni assets bajo `docs/frontendMockups`.
- Los componentes y features consumen tokens semánticos productivos. Ninguna feature duplica paleta, radios, sombras o escala espacial.
- Candidatos con reutilización clara: `PageContainer`, `PageHeader`, `QuickAccessGrid`, `QuickAccessCard`, `InformationalState`; evitar abstracciones triviales.
- En móvil: drawer con backdrop, cierre por botón/selección, gestión del fondo, targets táctiles, breadcrumbs sin overflow, perfil accesible, grid a una columna y scroll natural.

## Criterios verificables

- `Resumen` activo y contenido visible real en `main`.
- Accesos rápidos solo a rutas existentes y filtrados por roles/capacidades existentes; la UI no sustituye autorización del servidor.
- Conservación de Clientes, menú móvil/backdrop/navegación, perfil/Escape/foco, logout, tema/persistencia, breadcrumbs, shell supervisor y plataforma.
- Prueba visual determinista con desktop, tablet, móvil, drawer abierto, Clientes expandido, perfil abierto, oscuro, Clientes, supervisor y plataforma.
- Ejecutar los comandos pedidos por el usuario: tests focalizados, `typecheck`, Playwright visual, `build` y `lint`. Por cambio compartido, ejecutar también suite frontend completa y visuales de login, recuperación, Clientes y Rutas. Inspeccionar las capturas generadas.

## Estado de seguridad

Final: `NOT_APPLICABLE`. El diff validado es presentacional y de pruebas; no cambia autenticación, autorización, sesión, datos sensibles, secretos ni infraestructura.

## Delta de corrección visual obligatoria

Fuente exacta: `docs/frontendMockups/_golden-company-dashboard.html`; captura aprobada: `docs/frontendMockups/redesign/captures/company-dashboard-desktop.png`; sistema: `docs/frontendMockups/assets/golden-system.css`, `golden-icons.js`, logo oficial y `docs/design/visual-system.md`.

El candidato anterior conserva indebidamente sidebar oscuro con gradiente, acento turquesa, tipografía Inter, logo recreado, perfil inferior oscuro, breadcrumb activo turquesa y control de tema con texto+switch. Sustituir únicamente la presentación por el golden: sidebar/superficies claros, paleta azul aprobada, Segoe UI, logo PNG productivo completo, topbar 72 px, botón de tema cuadrado 44 px, perfil claro, Auditoría atenuada y Clientes colapsado inicialmente en `/company/dashboard`. Mantener datos reales de sesión.

Proceso exigido: render golden y capturar implementación anterior a 1440×900; comparar lado a lado; corregir shell/logo/paleta/tipografía y luego espaciado/contenido; iterar capturas hasta que solo difieran datos dinámicos. Conservar snapshots de estados expandidos y overlays, pero añadir baseline desktop inicial con Clientes y perfil cerrados. No aceptar snapshots antes de inspección visual. Responsive obligatorio: 1440×900, 900×900 y 390×844, drawer, backdrop y oscuro.

## Delta de Development

- Corrección visual completada e inspeccionada contra el golden: tokens exactos del shell, sidebar claro de 252 px, PNG productivo verificado byte a byte en empresa y plataforma, `Segoe UI Variable`, azul de marca, topbar de 72 px y control de tema de 44 px con icono. En dark, el logo conserva la placa blanca y la marca azul del golden.
- El grupo Clientes inicia cerrado en `/company/dashboard` y conserva expansión automática en rutas hijas; Auditoría es semánticamente disabled.
- Baseline nuevo `company-dashboard-desktop.png`; los demás estados se conservan y se recapturaron al viewport, sin clipping del drawer.
- El único delta posterior a la primera QA fue test-only: `theme.visual.spec.ts` dejó de esperar el canvas oscuro legado y ahora verifica el token golden `rgb(11, 18, 32)`; la regresión visual relacionada pasa 34/34.
