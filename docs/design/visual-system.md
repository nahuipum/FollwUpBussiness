# Sistema visual de followUp Business

**Estado:** aprobado  
**Fuente visual:** `docs/frontendMockups/redesign/direction-b.html`  
**Catálogo:** `docs/frontendMockups/_design-system.html`  
**Shell:** `docs/frontendMockups/_application-shell.html`

## 1. Alcance

Este documento define el lenguaje visual reutilizable de followUp Business. Es
normativo para color, tipografía, espaciado, forma, elevación, iconografía,
estados visuales, componentes y adaptación responsive.

No define reglas funcionales, permisos, contratos, navegación, datos, estados de
negocio ni comportamiento de las operaciones. Un mockup tampoco reemplaza las
historias, contratos, componentes accesibles ni pruebas existentes.

La dirección busca una apariencia SaaS profesional: superficies limpias, azul
como acción principal, jerarquía serena, densidad media y lectura rápida. La
última actualización permanece en la topbar porque es información transversal.
El selector de tema se ubica junto a las utilidades globales y el perfil.

### 1.1 Identidad de marca

La marca oficial utiliza el lockup horizontal completo aprobado: símbolo de
ubicación, ruta y actividad junto al nombre “followUp Business”. El archivo
canónico es `docs/frontendMockups/assets/brand/followup-logo.png`.

- El logo se usa completo, con transparencia y en su proporción original 3:1.
- No se recorta para obtener un isotipo ni se agrega texto independiente a su
  lado, porque el nombre ya forma parte del arte aprobado.
- No se recolorea, deforma, rota, aplica sobre fondos con poco contraste ni se
  sustituyen sus azules y navy por colores semánticos de estado.
- En tema oscuro se presenta sobre una placa blanca contenida; el PNG no se
  invierte ni se altera con filtros para forzar contraste.
- En el sidebar de escritorio y en el drawer móvil se alinea a la izquierda con
  un ancho máximo de 204 px y una altura máxima de 68 px.
- Si una superficie futura exige un símbolo compacto, debe aprobarse y
  exportarse como un asset propio; no se obtiene recortando este PNG en CSS.

## 2. Reglas no negociables

1. Las features consumen tokens semánticos; no usan colores hexadecimales,
   sombras, radios o tamaños arbitrarios.
2. Una feature no crea otra familia de `primary`, `secondary`, `danger`, campo,
   badge, card, tabla, alerta o modal. Usa las variantes de este sistema.
3. Una excepción visual repetible se incorpora primero al sistema y después a
   la feature. Una excepción local requiere una razón documentada y no puede
   redefinir estados interactivos.
4. Los componentes mantienen la misma anatomía en tema claro y oscuro. El tema
   cambia tokens, no estructura, orden, permisos ni contenido.
5. Loading, vacío, error y sin permisos conservan el espacio y contexto del
   componente que reemplazan. No se comunican solo mediante color.
6. En móvil, una tabla se convierte en filas apiladas o cards con etiquetas; no
   impone desplazamiento horizontal como estrategia por defecto.
7. El orden visual y el orden de foco deben coincidir. No se usa
   `column-reverse` para cambiar el orden aparente de acciones.
8. El texto de producción no baja de 12 px. Los tamaños menores usados en
   mockups son exclusivamente una reducción de presentación.
9. Todo control interactivo tiene nombre accesible, foco visible y objetivo de
   al menos 44 × 44 px en contextos táctiles.
10. Las features no copian HTML del catálogo. Implementan o reutilizan las
    primitivas React correspondientes cuando se autorice la migración.

## 3. Tokens de color

Los nombres expresan propósito, no el color físico. Los componentes consumen la
capa semántica; la paleta base solo se usa para construirla.

### 3.1 Marca

| Token | Valor | Uso |
|---|---:|---|
| `brand.primary` | `#2563EB` | CTA, selección y ruta principal |
| `brand.primary.hover` | `#1D4ED8` | Hover del CTA |
| `brand.primary.strong` | `#175CD3` | Texto/enlace sobre fondos claros |
| `brand.primary.deep` | `#1849A9` | Acento de alto contraste |
| `brand.soft` | `#EFF6FF` | Selección, iconos y ayuda contextual |
| `brand.border` | `#B2CCFF` | Bordes de selección y foco suave |

### 3.2 Tema claro

| Token | Valor |
|---|---:|
| `canvas` | `#F6F8FC` |
| `surface` | `#FFFFFF` |
| `surface.subtle` | `#F9FAFB` |
| `surface.muted` | `#F2F4F7` |
| `text.strong` | `#101828` |
| `text.default` | `#182230` |
| `text.soft` | `#475467` |
| `text.muted` | `#667085` |
| `border.default` | `#E4E7EC` |
| `border.control` | `#D0D5DD` |
| `overlay` | `rgb(15 23 42 / 42%)` |

### 3.3 Tema oscuro

| Token | Valor |
|---|---:|
| `canvas` | `#0B1220` |
| `surface` | `#111827` |
| `surface.raised` | `#172033` |
| `surface.subtle` | `#0F172A` |
| `surface.muted` | `#1B2638` |
| `text.strong` | `#F8FAFC` |
| `text.default` | `#E5EAF2` |
| `text.soft` | `#C6CFDD` |
| `text.muted` | `#A7B1C2` |
| `border.default` | `#293548` |
| `border.control` | `#3A475B` |
| `overlay` | `rgb(2 6 23 / 68%)` |

### 3.4 Estados semánticos

| Estado | Claro: texto / fondo | Oscuro: texto / fondo |
|---|---|---|
| Éxito | `#067647` / `#ECFDF3` | `#6CE9A6` / `#113526` |
| Advertencia | `#B54708` / `#FFFAEB` | `#FEC84B` / `#3A2A10` |
| Error | `#B42318` / `#FEF3F2` | `#FDA29B` / `#3B171D` |
| Información | `#175CD3` / `#EFF6FF` | `#84ADFF` / `#172554` |

El color siempre se acompaña de texto, icono, patrón o posición. Los contrastes
de referencia son: primaria 5,17:1; texto secundario claro 4,97:1; texto
secundario oscuro 8,20:1; semánticos claros entre 5,20:1 y 6,05:1.

## 4. Tipografía

Pila: `"Segoe UI Variable", "Segoe UI", system-ui, sans-serif`. No se depende de
una fuente remota. Se usan pesos reales `400`, `500`, `600`, `700` y `800`.

| Rol | Tamaño / línea | Peso | Uso |
|---|---|---:|---|
| Display | 32 / 40 px | 700 | Título principal de pantalla |
| Heading 1 | 28 / 36 px | 700 | Título de página compacto |
| Heading 2 | 22 / 30 px | 700 | Modal o sección principal |
| Heading 3 | 18 / 26 px | 700 | Card o subsección |
| Body | 14 / 20 px | 400 | Texto general |
| Body strong | 14 / 20 px | 600 | Datos y énfasis |
| Small | 12 / 16 px | 400 | Metadatos y ayudas |
| Label | 12 / 16 px | 600 | Etiquetas de campo y tabla |
| Eyebrow | 12 / 16 px | 700 | Contexto en mayúsculas, tracking 0,08 em |

Los títulos usan tracking negativo entre `-0.02em` y `-0.04em`. El cuerpo no
usa tracking negativo. No se crean tamaños intermedios sin incorporarlos a esta
escala.

## 5. Espaciado, radios y sombras

### 5.1 Espaciado

| Token | Valor | Uso típico |
|---|---:|---|
| `space.1` | 4 px | Separación mínima |
| `space.2` | 8 px | Icono–texto, controles compactos |
| `space.3` | 12 px | Grupos internos |
| `space.4` | 16 px | Padding móvil y cards compactas |
| `space.5` | 24 px | Cards, modales y secciones |
| `space.6` | 32 px | Separación de bloques |
| `space.7` | 48 px | Ritmo de página |
| `space.8` | 64 px | Separación excepcional de layouts |

### 5.2 Radios

| Token | Valor | Uso |
|---|---:|---|
| `radius.sm` | 8 px | Paginación e icon buttons |
| `radius.md` | 12 px | Campos y botones |
| `radius.lg` | 16 px | Cards y paneles |
| `radius.xl` | 22 px | Modales o superficies destacadas |
| `radius.pill` | 999 px | Badges, chips y switches |

### 5.3 Sombras

| Token | Valor | Uso |
|---|---|---|
| `shadow.sm` | `0 1px 3px rgb(16 24 40 / 7%)` | Cards y controles elevados |
| `shadow.md` | `0 12px 28px rgb(16 24 40 / 12%)` | Popovers |
| `shadow.lg` | `0 16px 44px rgb(16 24 40 / 14%)` | Modal y drawer |

Una superficie usa borde o sombra pequeña; no ambos con intensidad alta. En
oscuro prevalece el borde y la sombra se reserva para overlays y separación de
planos.

## 6. Iconografía

- Familia lineal coherente, equivalente a Lucide; no mezclar iconos rellenos,
  emojis o glifos Unicode dentro de la interfaz.
- Trazo `1.75–2 px`, extremos redondeados y `currentColor`.
- Tamaños permitidos: 16 px inline, 20 px estándar y 24 px destacado.
- Un icon button tiene área mínima de 40 px en escritorio y 44 px táctil.
- Los iconos decorativos usan `aria-hidden="true"`; un botón solo con icono usa
  `aria-label`.
- Mapa y navegación mantienen asignaciones estables: cuadrícula = Resumen,
  personas = Equipo, ficha = Clientes, nodos conectados = Rutas, pin =
  Territorios, subida = Importaciones, engranaje = Configuración.

## 7. Componentes

### 7.1 Botones

Variantes autorizadas: `primary`, `secondary`, `ghost`, `danger` e `icon`.
Altura estándar 44 px; compacta 36 px solo en tablas y toolbars. Radio 12 px.

- Primary: una acción dominante por región. Azul, texto blanco.
- Secondary: superficie, borde de control y texto fuerte.
- Ghost: sin borde en reposo; reservado para acciones de baja jerarquía.
- Danger: se usa únicamente para una acción destructiva explícita.
- Disabled: conserva legibilidad, elimina sombra, usa opacidad máxima de 60 % y
  no depende solo de bajar opacidad para explicar por qué está deshabilitado.
- Loading: mantiene el ancho de la etiqueta, añade spinner y cambia el texto a
  verbo progresivo.

### 7.2 Campos y selects

Anatomía: label, control, ayuda opcional y error. Altura mínima 44 px, padding
horizontal 12 px, radio 12 px y borde `border.control`.

- Hover: oscurecer borde un nivel.
- Focus: borde `brand.primary` y anillo exterior de 3 px con azul al 24 %.
- Error: borde y mensaje `error`; conservar el foco azul si el usuario está
  editando y mostrar el error debajo.
- Disabled: fondo `surface.muted`, texto legible y cursor no interactivo.
- Select: usa chevron consistente; no imita un select con texto sin semántica.

`AppSelect` es la única apariencia de selector de la aplicación. Su anatomía
reutilizable es label, trigger, valor, chevron, popover y opciones. El popover
usa `surface.raised`, `shadow.md`, radio 12 px y una opción seleccionada con
fondo `brand.soft`, texto azul y check. Debe implementarse con una primitiva
accesible de listbox/select en producción; el `<details>` del mockup solo
representa su comportamiento visual sin agregar lógica funcional.

### 7.3 Filtros

`FilterBar` distribuye búsqueda, selects y fechas por capacidad del contenedor.
Los filtros aplicados aparecen como chips removibles y se acompaña el total de
resultados. La acción “Limpiar filtros” solo aparece cuando existe al menos uno.

Filtros y chips forman una sola región: 18 px en los bordes, 12 px entre
controles y chips, y 16 px antes del separador inferior. No se añade una franja
con padding independiente entre los filtros y el encabezado de resultados.

Desktop: búsqueda amplia y controles en la misma fila. Tablet: dos columnas.
Móvil: una columna; los chips pueden desplazarse horizontalmente, pero los
campos y resultados no.

### 7.4 Badges

Forma pill, altura visual 24–28 px, texto de 12 px y peso 600–700. Incluyen un
punto o icono además del color. Usan exclusivamente los cuatro tonos semánticos
o una variante neutral.

### 7.5 Cards y superficies

Variantes autorizadas: `default`, `subtle`, `interactive`, `status` y
`collection`. Radio 16 px, borde estándar y padding 16 o 24 px.

Una card interactiva muestra hover y foco en toda su superficie. Una card no se
anida dentro de otra card con la misma elevación; la hija usa `surface.subtle`.

### 7.6 Tablas y paginación

La tabla conserva `table`, encabezados y relaciones semánticas. Encabezado sobre
`surface.subtle`, filas de 52–56 px y acciones en la última columna.

Toda colección tabular comienza con `TableHeader`: título “Resultados”, total o
contexto breve y acciones opcionales. Esta franja permanece visible y separada
de los filtros cuando el ancho se reduce. En anchos medios, las columnas usan
scroll interno y el encabezado de columnas es sticky; en móvil se reemplaza por
data cards etiquetadas sin perder `TableHeader`.

- Desktop: tabla completa.
- Tablet: tabla completa cuando el contenedor lo permita; reducir columnas solo
  por prioridad declarada, nunca por ancho global arbitrario.
- Móvil: `ResponsiveDataView` presenta cards etiquetadas con todos los datos y
  acciones relevantes.
- La paginación separa resumen y navegación; nunca superpone actualización,
  selector de tamaño y páginas.
- La última actualización no vive en la paginación: permanece en la topbar.

### 7.7 Alertas y estados

La alerta inline contiene icono, título, descripción, acción opcional y código
de referencia cuando exista. No muestra detalles internos.

Los estados de colección son mutuamente excluyentes:

- Loading inicial: skeleton que reproduce la anatomía; `aria-busy="true"` y
  texto accesible.
- Actualización: conservar datos y añadir indicador no bloqueante.
- Vacío inicial: explicación y CTA de creación cuando corresponda.
- Sin resultados: explicar filtros y ofrecer limpiarlos.
- Error: conservar datos previos si existen, marcarlos como no vigentes y
  ofrecer reintento.
- Sin permisos: no renderizar datos protegidos; mensaje claro y retorno seguro.

### 7.8 Modales y drawers

Base única: overlay, superficie, encabezado, cuerpo desplazable y footer. Debe
capturar/restaurar foco, cerrar con Escape cuando corresponda y usar
`aria-modal="true"` y `aria-labelledby`.

- Confirmaciones y mensajes breves: modal centrado, máximo 480 px.
- Formularios medianos/largos: drawer derecho de 420–520 px.
- En drawer, header y footer son persistentes; solo el cuerpo hace scroll.
- Acciones siempre en el footer inferior. Orden DOM: Cancelar y luego primaria.
- En móvil, el drawer ocupa la pantalla completa y mantiene el mismo orden.
- Un mapa rápido puede usar modal; la gestión completa de rutas usa una página
  o workspace map-first, nunca un modal estrecho.

## 8. Shell de aplicación

### Sidebar

Ancho de referencia 252 px. Contiene marca, contexto de empresa, navegación y
ayuda. La opción activa usa fondo azul suave, texto e icono azules. En tablet y
móvil se convierte en drawer antes de que el contenido
quede por debajo de un ancho útil.

### Topbar

Altura 68 px. Orden recomendado:

1. menú móvil y breadcrumbs;
2. última actualización;
3. selector de tema;
4. notificaciones;
5. perfil.

La última actualización se mantiene visible. En móvil se compacta en una
cápsula con la hora, pero no baja al contenido ni a la paginación.

## 9. Mapas y rutas

La vista principal recomendada es un espacio operativo `map + route panel`:
mapa dominante, trayecto y alternativas visibles, itinerario persistente y
acciones de ruta en el panel lateral.

También se permiten:

1. `map + list` para búsqueda, selección y comparación masiva;
2. modal de mapa para confirmar o corregir una ubicación puntual.

Estas son reglas de presentación. Qué acciones, datos o permisos aparecen debe
venir de historias y contratos.

## 10. Responsive

Los breakpoints de referencia son una protección del shell; dentro de features
se prefieren container queries.

| Capacidad | Referencia | Comportamiento visual |
|---|---:|---|
| Amplia | `> 1060 px` | Sidebar fija, tabla completa, acciones en línea |
| Media | `621–1060 px` | Sidebar drawer, filtros a dos columnas, tabla compacta |
| Estrecha | `≤ 620 px` | Una columna, CTA ancho, data cards, modal full-screen |

Se valida como mínimo en 1440, 768 y 390 px. El documento no puede tener
overflow horizontal. Mapas, tablas y modales pueden gestionar overflow interno
solo cuando el contenido lo requiera y existe alternativa accesible.

## 11. Estados interactivos y accesibilidad

- Contraste WCAG AA: 4,5:1 para texto normal, 3:1 para texto grande e iconos
  funcionales.
- Foco: anillo visible de 3 px; nunca eliminar `outline` sin reemplazo.
- Hover: refuerza borde, superficie o tono; no desplaza el layout.
- Active/selected: combina color, forma y semántica (`aria-current`,
  `aria-selected` o equivalente).
- Disabled: mantiene legibilidad y semántica nativa `disabled`.
- Error: mensaje asociado con `aria-describedby`; alertas críticas usan
  `role="alert"` de forma proporcional.
- Movimiento: transiciones de 120–180 ms; skeleton y animaciones respetan
  `prefers-reduced-motion`.
- Tema: el control anuncia su estado y mantiene la preferencia sin provocar
  parpadeo de tema.

## 12. Gobernanza

Antes de aceptar una nueva variante visual se comprueba:

1. que no exista ya un token o componente equivalente;
2. que resuelva al menos dos usos reales o una necesidad de accesibilidad;
3. que incluya claro, oscuro, hover, focus, disabled, error y responsive cuando
   apliquen;
4. que actualice este documento y `_design-system.html`;
5. que no cambie reglas funcionales ni contratos.

La migración futura debe centralizar tokens y primitivas primero. Una feature se
considera migrada solo cuando elimina sus literales y familias visuales locales,
consume componentes compartidos y conserva comportamiento, permisos y pruebas.
