---
name: frontend-mockup-guidance
description: Apply and evolve the HTML visual mockup convention for FollowUpBussiness frontend stories. Use when implementing or visually changing a React/TypeScript HU with an ID such as FE-001.
---

# Frontend Mockup Guidance

Usar únicamente durante Desarrollo Frontend; no cargar esta guía para QA,
Seguridad o DoF.

1. Identificar el ID de la HU y buscar primero el archivo exacto
   `docs/frontendMockups/<HU-ID>.html`.
2. Si existe, tratarlo como referencia visual: composición, jerarquía,
   espaciado, tipografía, colores, componentes, comportamiento responsive y
   estados dibujados. Implementar la interfaz en React/TypeScript sin copiar el
   HTML como código de producción.
3. Si no existe, revisar los mockups HTML existentes y extraer patrones
   reutilizables antes de diseñar. Mantener sus tokens y convenciones, y crear
   `docs/frontendMockups/<HU-ID>.html` si hace falta dejar la nueva propuesta
   visual como referencia para implementaciones futuras.
4. Dar prioridad a la HU, contrato y accesibilidad cuando contradigan o
   completen un mockup. No inferir permisos, flujos, datos ni reglas de negocio
   desde el diseño.
5. No modificar un mockup existente como efecto lateral de implementar la HU.
   Indicar en el handoff la ruta consultada o creada.

