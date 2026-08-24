# MOB-033 — Definir sistema visual y componentes base mobile

**Área:** Mobile  
**Tipo:** Historia de habilitación de experiencia  
**Épica:** Experiencia  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** vendedor  
**Quiero** una interfaz móvil consistente y accesible  
**Para** reconocer acciones y estados operativos sin tener que reaprender cada módulo.

## Alcance

Definir e implementar en Flutter los *tokens* visuales y componentes reutilizables
del cliente vendedor: tipografía, color, espaciado, elevación, controles,
mensajes, indicadores y estados. Parte del mockup de acceso existente; no
agrega reglas de negocio ni modifica contratos.

## Criterios de aceptación

1. Existe un tema único con tokens de color, tipografía, espaciado y estados
   semánticos; el contraste y foco son accesibles.
2. Los componentes base (botón, campo, selector, tarjeta, estado, diálogo y
   aviso) tienen variantes de carga, inactivo, error y éxito sin comunicar solo
   por color.
3. Todos los componentes soportan lectores de pantalla, tamaño de texto del
   sistema y objetivos táctiles adecuados.
4. El mockup `MOB-001` se toma como referencia visual de acceso y se documenta
   cómo se aplica al resto de módulos; no se alteran sus reglas funcionales.
5. No se registran datos personales, credenciales ni ubicación al renderizar
   componentes o estados.

## Referencias

- RNF-002
- RNF-006
- MOB-001

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 3 — Importación y configuración operativa.
- **Predecesoras obligatorias:** `MOB-001` — Iniciar sesión móvil; `MOB-027` — Proteger datos locales.
- **Historias consecuentes que habilita:** `MOB-034` — Definir navegación y plantillas operativas mobile; `MOB-004` a `MOB-006`; `MOB-007` a `MOB-026`; `MOB-029` a `MOB-032`.
- **Validación vertical:** análisis Flutter y pruebas de widgets de componentes; las historias funcionales validan su uso real.

## Puerta de Ready para esta historia

- El alcance visual no crea permisos, flujos de negocio ni llamadas a API.
- Los componentes deben poder usarse con datos vacíos, errores y texto de
  sistema ampliado antes de que consuman módulos operativos.
<!-- delivery-traceability:end -->
