# Auditoría visual del frontend de FollowUpBussiness

**Fecha:** 2026-09-09  
**Propósito:** base técnica y visual para un rediseño progresivo.  
**Alcance:** implementación React actual, estilos globales y por feature, componentes compartidos, layouts, mockups HTML y pruebas visuales.  
**Fuera de alcance:** modificar el frontend, alterar los mockups o definir reglas de negocio nuevas.

## Conclusión ejecutiva

El frontend ya tiene una identidad reconocible y bastante consistente en su paleta principal: azul marino, teal, superficies claras, bordes suaves y radios redondeados. El acceso y recuperación de contraseña son las superficies más maduras; el patrón de listado administrativo también es reutilizable. No conviene reescribir todo.

El problema central es estructural: la consistencia se obtiene por repetición de CSS, no mediante un sistema de diseño. El inventario contiene 37 hojas CSS, 19 familias visibles de clases para acciones primarias/secundarias, 38 valores distintos de `font-size`, 21 valores de `border-radius` y 215 literales hexadecimales distintos. Este último número incluye estados semánticos, tema oscuro e iconos SVG embebidos, pero aun así evidencia que los tokens existentes no gobiernan la implementación.

La deuda más urgente está en tablet. A 768 px el layout conserva el sidebar fijo de 250 px porque el cambio a drawer ocurre recién en 760 px. Quedan aproximadamente 518 px para navegación superior y contenido: breadcrumbs, selector de tema y perfil se parten en varias líneas; la paginación se solapa y las tablas requieren desplazamiento horizontal. En 390 px la aplicación cambia a drawer y se comporta mejor que en 768 px.

La recomendación es conservar la arquitectura funcional y los componentes accesibles, introducir tokens y primitivas visuales debajo de ellos, y migrar pantalla por pantalla. Una reescritura completa tendría mucho riesgo de perder estados asíncronos, aislamiento por rol, foco de modales, manejo de sesión, mapas y conductas de concurrencia ya resueltas.

## Método y evidencia

Se inspeccionaron:

- `frontend/followupbussiness/src/styles`;
- `frontend/followupbussiness/src/shared/ui`;
- `frontend/followupbussiness/src/shared/layout`;
- todas las hojas CSS bajo `src/features`;
- las rutas y decisiones de visibilidad observables en `App.tsx`, `auth.ts` y los layouts;
- los 9 mockups HTML de `docs/frontendMockups`;
- las 3 suites existentes en `tests/visual`.

Se ejecutó Vite con respuestas HTTP simuladas equivalentes a las de las pruebas visuales y se revisaron acceso, shell autenticado, listado de clientes, calendario, modo oscuro, vacío de empresas y modal de creación. Se capturaron y midieron vistas de 1440 × 900, 768 × 900 y 390 × 844. En los recorridos medidos no hubo overflow horizontal del documento (`scrollWidth === innerWidth`), pero sí overflow interno de tablas y modales.

La ejecución actual de `npm run test:visual -- --reporter=line` dio **13 pruebas aprobadas y 9 fallidas de 22**. Las fallas no constituyen por sí solas nueve defectos visuales: revelan principalmente recorridos y expectativas desactualizados, además de interferencias entre mocks y el manejador global de errores. En particular:

- el test de tema busca un `menuitemcheckbox` dentro del perfil, mientras la implementación expone ahora un `switch` en la topbar;
- el test de clientes abre el grupo “Clientes”, pero no selecciona “Gestión de clientes” antes de esperar el título;
- el test móvil de acceso espera 24 px de padding y la implementación aplica 20 px;
- varios mocks de recuperación terminan mostrando el estado de error global en lugar del estado local esperado.

Las pruebas solo definen 1440 y 390 px. Generan screenshots, pero no usan comparación de imágenes (`toHaveScreenshot`), por lo que hoy son recorridos visuales asistidos, no una barrera automática contra regresiones.

## Inventario de roles y pantallas implementadas

Los permisos de la tabla son los observados en el código actual; no se interpretan como reglas de negocio nuevas.

| Área / ruta | Rol observable | Superficie y estado actual |
|---|---|---|
| `/` | Público | Inicio de sesión con composición dividida 50/50 en desktop y formulario único debajo de 900 px. |
| `/password-recovery` | Público | Solicitud de recuperación, validación, cooldown, indisponibilidad y carga. |
| `/password-recovery/confirmation` | Público | Confirmación de solicitud. |
| `/password-reset` | Público | Nueva contraseña, reglas, validación, carga y errores de token. |
| `/password-reset/success` | Público | Estado de éxito. |
| Errores globales | Todos | Diálogo 401; páginas 400, 403, 404 y 500; alertas inline 409/422. |
| `/platform/dashboard` | `PLATFORM_SUPERADMIN` | Shell completo, contenido del dashboard vacío. |
| `/platform/companies` | `PLATFORM_SUPERADMIN` | Listado/filtros, vacío, creación, detalle, onboarding, provisión, suspensión/reactivación y resultados. Es la feature visualmente más extensa. |
| `/company/dashboard` | `COMPANY_ADMIN` | Shell completo, contenido del dashboard vacío. |
| `/company/administrators-supervisors` | `COMPANY_ADMIN`; acceso directo también permitido a `SUPERVISOR` | Listado, filtros, invitación, detalle y estado. Modo lectura para quien no administra. |
| `/company/sellers`, `/supervisor/sellers` | `COMPANY_ADMIN` / `SUPERVISOR` | Listado, filtros, alta/edición, asignación, invitación, detalle y cambios de estado; lectura o acciones según rol observable. |
| `/company/territories`, `/supervisor/territories` | `COMPANY_ADMIN` / `SUPERVISOR` | Listado, filtros, formulario, detalle de estado y aviso de solo lectura. |
| `/company/clients`, `/supervisor/clients` | `COMPANY_ADMIN` / `SUPERVISOR` | Listado con seis filtros, tabla, estados, formulario, detalle y acciones. |
| `/company/clients/map`, `/supervisor/clients/map` | `COMPANY_ADMIN` / `SUPERVISOR` | Mapa general, filtros, listado alternativo y estados de datos/ubicación. |
| `/company/customer-imports` y resultado dinámico | `COMPANY_ADMIN` | Descarga de plantilla, carga, progreso, resumen y archivo de rechazados. |
| `/company/customer-assignments` | `COMPANY_ADMIN` | Selección masiva, filtros, responsables, vigencia, confirmación y resultados. |
| `/company/routes`, `/supervisor/routes` | `COMPANY_ADMIN` / `SUPERVISOR` | Listado, filtros, detalle, borrador, ordenamiento, propuesta, mapa de secuencia y publicación. |
| `/company/settings`, `/supervisor/settings` | `COMPANY_ADMIN` / `SUPERVISOR` | Configuración operativa, geocerca/tracking y solo lectura cuando aplica. |
| `/supervisor/dashboard` | `SUPERVISOR` | Shell completo, contenido del dashboard vacío. |
| `/seller/dashboard` | `SELLER` | La ruta está protegida, pero `App.tsx` no tiene una rama que renderice un dashboard; se llega al estado genérico de redirección. |
| `/seller/settings` | `SELLER` | El shell se renderiza, pero la página de configuración devuelve “No tienes permisos” con la lógica actual. |

Hay además entradas visibles de navegación sin destino implementado: “Auditoría” para plataforma/empresa y “Configuración” en plataforma. Deben tratarse como placeholders actuales, no como definición del futuro producto.

## Inventario de mockups

La carpeta contiene nueve documentos estáticos:

- tres variantes de FE-001 (`FE-001.html`, `FE-001-login-states.html`, `FE-001-login-states-v2.html`);
- dos variantes de FE-002, incluida `FE-002-password-recovery-states-v3.html`;
- FE-004 para usuarios y roles;
- FE-034 como kit de errores y permisos;
- FE-039 para onboarding de empresa;
- FE-040 para suspensión/reactivación.

La implementación de acceso/recuperación sigue de cerca la variante más reciente, y empresas conserva el lenguaje de FE-039/FE-040. El riesgo está en que no existe un índice que marque una variante como canónica o archivada. Los mockups también mantienen tokens dentro de cada HTML y usan breakpoints distintos: 390, 430, 520, 560, 700, 720, 820, 900, 980, 1100, 1160, 1220 y 1280 px. Son referencias útiles de intención, pero no un sistema sincronizado con el código.

## Patrones visuales repetidos

1. **Shell autenticado.** Sidebar azul con marca, contexto y perfil; topbar con breadcrumbs, tema y perfil; área de contenido clara.
2. **Encabezado de página.** Título de 28–32 px, descripción secundaria y CTA teal alineado a la derecha; en móvil pasa a columna y el CTA ocupa todo el ancho.
3. **Listado administrativo.** Card blanca de 18 px, toolbar de búsqueda/filtros, tabla, badges de estado y paginación.
4. **Formulario transaccional.** Labels pequeños en negrita, controles de 42–44 px, bordes azul grisáceo, ayuda/error debajo y acciones primaria/secundaria.
5. **Modal.** Overlay oscuro, superficie blanca de 18–22 px, encabezado con módulo y cierre, cuerpo desplazable y footer de acciones.
6. **Estados del sistema.** Carga, vacío, error, solo lectura, aviso inline, confirmación, éxito y correlación técnica.
7. **Identidad visual.** Navy para estructura, teal para selección/acción, fondos `#f7f9fc`/blanco y semánticos verde/ámbar/rojo.
8. **Acceso.** Panel narrativo con ilustración de mapa y panel de formulario; en móvil desaparece la ilustración y se conservan marca, seguridad y copyright.

## Inconsistencias y deuda visual

### Colores y tema

- La paleta principal es coherente, pero se aplica mediante literales en cada feature. Los colores `#176d77`, `#67778a`, `#26384a`, `#cfd9e4`, `#14213d` y `#fff` se repiten decenas de veces.
- Existen varios tonos casi equivalentes para texto secundario (`#67778a`, `#6f82a0`, `#7184a0`, `#7386a1`, `#8090a0`, entre otros) sin una diferencia semántica explícita.
- El tema claro está mayormente hardcodeado. El tema oscuro depende de una hoja de 355 líneas que enumera selectores de features. Cada componente nuevo corre el riesgo de quedar parcialmente sin tematizar.
- El modo oscuro observado en Clientes es visualmente coherente, pero no tiene una matriz de regresión vigente porque su prueba falla antes de la captura.

### Tipografía

- `Inter` se declara como primera opción, pero no existe `@font-face`, import remoto ni dependencia que la cargue. La apariencia depende del sistema operativo y del fallback disponible.
- Hay 38 tamaños de fuente y pesos como 720, 750 y 790 sin una escala tipográfica nombrada. Esto produce microdiferencias entre features y resultados distintos cuando el fallback no soporta esos pesos.
- Los títulos de autenticación usan otra escala y densidad que los del panel, lo cual puede conservarse como familia expresiva, pero debe ser deliberado y documentado.

### Espaciado, radios y sombras

- Se reconoce una base de 8/12/16/20/24 px, pero convive con abundantes valores únicos de 11, 13, 14, 15, 17, 18, 22, 26, 28, 31, 34, 35 y 42 px.
- Hay 21 valores de radio. Cards principales suelen usar 18 px; controles alternan 8, 9, 10, 11 y 12 px; modales alternan 18 y 22 px.
- Las cards comparten intención, pero no siempre borde, sombra o padding. Empresas, usuarios, vendedores, zonas, clientes, rutas, importación y configuración recrean el patrón.

### Botones y controles

- Se observaron 19 familias de clases primary/secondary: `company-button`, `company-users`, `seller-list`, `territory-list`, `client-list`, `client-form`, `route-list`, `customer-import`, `operation-dialog`, `primary-button`, entre otras.
- La acción principal teal es consistente en color, pero varía en altura, radio, padding, sombra, hover, disabled y foco.
- Varios footers móviles usan `flex-direction: column-reverse`. La intención visual de colocar la primaria arriba es clara, pero puede separar el orden visual del orden de foco/DOM.
- Búsqueda, select, fecha y inputs comparten apariencia general, aunque cada feature redefine estados de hover/foco/error.

### Cards, tablas y modales

- `DataTable` conserva HTML semántico, pero debajo de 760 px impone `min-width: 760px`; Clientes eleva esa base a 820 px y Vendedores a 920 px. En 768 y 390 px solo se ve una parte de la tabla y se requiere scroll horizontal interno.
- A 768 px la paginación de Clientes superpone “Mostrando…”, “Actualizado…” y “Registros por página”. El media query correctivo solo entra a 760 px.
- `ModalSurface` y `ModalHeader` son una buena base, pero conviven con `ModalDialog`, `PasswordRecoveryDialog`, un backdrop/diálogo propio en usuarios y secciones que imitan manualmente `modal-surface` en vendedores.
- El calendario es un popover fijo de 304 px. A 768 px se abre cruzando visualmente el borde del sidebar; necesita posicionamiento con detección de colisión y contexto de workspace.
- El modal de crear empresa funciona en las tres medidas. En 390 px ocupa casi toda la altura, usa scroll interno y cambia el orden visual de acciones; el botón secundario queda inicialmente parcialmente bajo el pliegue.

### Deuda responsive por ancho

| Ancho revisado | Resultado | Deuda principal |
|---|---|---|
| 1440 px | Correcto como referencia desktop: jerarquía clara, sidebar estable, filtros en una línea y modales centrados. | Mucho espacio vacío en dashboards; densidad de sidebar alta en empresa. |
| 768 px | Sin overflow del documento, pero aún usa layout desktop con sidebar de 250 px. | Topbar partida, contenido angosto, tabla con scroll, paginación solapada y popover sobre sidebar. Es el breakpoint prioritario. |
| 390 px | Drawer, topbar compacta, CTA y filtros a ancho completo. La composición general es legible. | Tabla horizontal de 820 px, paginación densa, modales altos con scroll y acciones reordenadas. |

Los estilos usan numerosos breakpoints por feature y casi ningún criterio por ancho real del contenedor. Solo Asignar cartera empieza a usar una container query. El rediseño debería basarse en capacidad de contenido, no únicamente en ancho global de viewport.

### Superficies incompletas

- Los dashboards de plataforma, empresa y supervisor son contenedores vacíos. En una sesión válida se muestra chrome completo alrededor de una superficie sin contenido ni estado vacío explicativo.
- Auditoría y Configuración de plataforma aparecen como opciones inertes.
- El flujo Seller tiene rutas protegidas, pero no una pantalla de dashboard renderizada y su configuración termina en un estado de permiso insuficiente.

Estas observaciones describen el estado del frontend; decidir qué debe existir requiere historias/contratos y no forma parte de esta auditoría.

## Componentes que conviene conservar

| Base actual | Qué conservar | Ajuste recomendado |
|---|---|---|
| `DashboardLayout` | Semántica de navegación, drawer móvil, breadcrumbs, perfil y control de tema. | Replantear breakpoint tablet, densidad y variantes por cantidad de navegación. |
| `ModalSurface` + `useDialogFocus` | Portal, captura/restauración de foco, Escape y superficie desplazable. | Convertirlo en única infraestructura de diálogo. |
| `ModalHeader` | Estructura accesible de título, módulo, descripción y cierre. | Integrarlo en variantes estándar de modal. |
| `DataTable` | Tabla semántica, columnas declarativas, estados, identidad y paginación. | Añadir estrategia responsive por columna/prioridad o vista card; eliminar mínimos rígidos por defecto. |
| `VisualSelect`, `DateFilterField`, `MultiSelect`, `TimeField`, `FileUploadField` | Comportamiento y accesibilidad ya probados. | Compartir shell visual, tokens de campo y posicionamiento de popovers. |
| `AsyncStateCard`, `TableLoadingIndicator`, `ReadOnlyNotice`, `FormAlert` y `error-ui` | Cobertura de estados reales y lenguaje comprensible. | Unificar anatomía, iconografía, tonos y espaciado en un sistema de feedback. |
| `TableActionMenu` y `DataTableStatus` | Patrones compactos de acciones y estado. | Normalizar tamaños, zonas de toque y tema. |
| `BrandPanel` y footer seguro | Identidad fuerte y composición madura para acceso. | Reducir CSS duplicado entre login y recuperación; definir variante pública única. |

## Componentes que necesitan unificarse

1. **`Button`** con variantes `primary`, `secondary`, `ghost`, `danger`, `icon`; tamaños y estados únicos.
2. **`PageHeader`** para título, descripción, eyebrow opcional, acciones y comportamiento móvil.
3. **`Surface/Card`** para borde, radio, sombra, padding y tema; variantes `collection`, `form`, `status`.
4. **`Field` / `FieldControl`** para label, ayuda, error, required y estados; utilizado por input, select, fecha, hora, textarea y upload.
5. **`FilterBar`** con reglas de distribución por capacidad del contenedor.
6. **`Dialog`** con variantes `form`, `confirm`, `result`, `alert` y `detail`, todas sobre `ModalSurface`.
7. **`StatusBadge`** para estados de empresa, usuario, vendedor, zona, cliente, ruta e importación sin duplicar colores.
8. **`CollectionView`** para loading/error/empty/table/paginación y metadatos de actualización.
9. **`ResponsiveDataView`** que pueda alternar tabla, filas apiladas o cards preservando todas las acciones y datos importantes.
10. **Tokens semánticos** para color, tipografía, espacio, radio, elevación, motion y breakpoints; tanto light como dark.

## Cuatro pantallas maestras recomendadas

### 1. Acceso público

Base para login, recuperación, confirmación, reset y éxito. Debe conservar la identidad del mapa en desktop, usar una única columna compacta en tablet/móvil y compartir footer, alertas, campos y estados. Esta pantalla define la familia visual pública, no las reglas de autenticación.

### 2. Índice administrativo

Base para Empresas, Administradores y supervisores, Vendedores, Zonas, Clientes y Rutas. Incluye shell, `PageHeader`, CTA, filtros, feedback, datos, estado vacío y paginación. Debe ofrecer tres densidades: tabla amplia, tabla compacta/container y cards móviles sin scroll horizontal obligatorio.

### 3. Flujo de creación o edición

Base para crear empresa, provisionar administrador, invitar usuario, editar vendedor/zona/cliente, configurar empresa, cargar clientes y asignar cartera. En desktop puede ser modal; en espacios estrechos debe comportarse como página o sheet de altura completa, con header y footer persistentes y orden visual/foco equivalente.

### 4. Vista operativa y geográfica

Base para dashboards, mapa de clientes, detalle/orden de rutas y futuras vistas de seguimiento. Debe combinar resumen, KPIs o estado vacío explícito, mapa/lista accesible, frescura de datos y panel de detalle. Permite resolver los dashboards hoy vacíos sin imponer qué métricas de negocio deben mostrarse.

## Riesgos de una reescritura completa

- **Pérdida de comportamiento probado.** Los componentes actuales resuelven sesión, reintentos, datos obsoletos, conflictos, foco, Escape, carga, empty/error y estados de solo lectura.
- **Regresiones de autorización.** Las mismas pantallas se componen de forma distinta para `PLATFORM_SUPERADMIN`, `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER`; rehacer rutas y navegación junto con el aspecto aumenta el riesgo de exponer acciones indebidas.
- **Regresiones en mapas y rutas.** MapLibre, ordenamiento drag-and-drop, alternativa accesible y modales grandes tienen dependencias de tamaño y ciclo de vida difíciles de reproducir de una vez.
- **Pérdida de trazabilidad contractual.** Formularios, límites, estados y mensajes actuales están ligados a contratos existentes; una reescritura visual puede introducir reglas implícitas si se rediseña flujo y lógica a la vez.
- **Falsa seguridad por mockups.** Hay variantes duplicadas y no canónicas. Rehacer “según mockup” puede reinstalar una versión anterior.
- **Ausencia de baseline automático.** Sin comparación visual y sin tablet en CI, una rama de reescritura acumularía divergencias durante semanas antes de ser evaluable.
- **Big bang de tema oscuro.** El tema actual depende de muchos selectores. Sustituir toda la capa a la vez haría difícil distinguir componentes faltantes de problemas de tokens.

## Propuesta de migración progresiva

### Fase 0 — Congelar evidencia

- Declarar un mockup canónico por historia y marcar los anteriores como archivados, sin borrarlos.
- Crear baselines para las cuatro pantallas maestras en 1440, 768 y 390 px, light/dark cuando aplique.
- Corregir únicamente el harness visual: recorridos, interceptores y expectativas; incorporar comparación de screenshots con umbrales controlados.

### Fase 1 — Fundaciones sin cambio funcional

- Introducir tokens semánticos para color, tipografía, espaciado, radio, sombra, motion y capas.
- Decidir si Inter se empaqueta o si se adopta explícitamente la pila del sistema.
- Hacer que light y dark consuman los mismos contratos de tokens, evitando listas de selectores por feature.
- Mantener la apariencia actual como primer objetivo para reducir el tamaño del cambio.

### Fase 2 — Primitivas compartidas

- Implementar `Button`, `PageHeader`, `Surface`, `Field`, `StatusBadge`, `FilterBar` y variantes de `Dialog`.
- Migrar primero componentes compartidos, conservando sus APIs de comportamiento y pruebas.
- Añadir pruebas de foco, orden de teclado, contraste y reduced motion además de screenshots.

### Fase 3 — Shell y responsive

- Resolver primero 768 px: cambiar el sidebar a drawer o rail antes de que el workspace quede por debajo de un ancho útil.
- Hacer la topbar resistente a nombres/breadcrumbs largos.
- Adoptar container queries para toolbars, grids y paginación.
- Implementar `ResponsiveDataView` antes de migrar listados completos.

### Fase 4 — Migración por cortes verticales

Orden sugerido, sin mezclar reglas de negocio con el cambio visual:

1. acceso y recuperación;
2. empresas y onboarding;
3. usuarios, vendedores y zonas;
4. clientes, mapa e importación;
5. asignación, rutas y configuración;
6. dashboards cuando sus historias definan contenido.

Cada corte debe cubrir roles aplicables, loading/empty/error/forbidden/stale, 1440/768/390, light/dark y navegación por teclado antes de retirar su CSS anterior.

### Fase 5 — Consolidación

- Eliminar familias CSS de feature solo después de que su última pantalla migre.
- Reducir `theme.css` a tokens y reglas globales reales.
- Mantener un catálogo vivo de componentes y una matriz pantalla × rol × estado × viewport.
- Medir la reducción de literales, variantes y excepciones; no considerar terminada la migración solo porque la pantalla “se ve nueva”.

## Prioridades recomendadas

1. Añadir cobertura visual de 768 px y reparar la suite actual.
2. Resolver el breakpoint del shell y la paginación/table responsive.
3. Formalizar tokens light/dark y tipografía.
4. Unificar botones, encabezados, cards, campos y modales.
5. Migrar por familias de pantalla, manteniendo comportamiento y permisos.
6. Definir contenido de dashboards y rutas Seller únicamente mediante historias/contratos posteriores.

