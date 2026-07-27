# ADR-001 — Monolito modular y arquitectura hexagonal
**Estado:** Aceptado

Se utilizará un único despliegue backend separado por dominios. Cada dominio expone puertos y protege sus adaptadores. La decisión reduce complejidad operativa durante el MVP sin renunciar a límites internos.
