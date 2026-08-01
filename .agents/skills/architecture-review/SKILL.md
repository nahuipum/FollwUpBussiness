---
name: architecture-review
description: Revisar cambios de arquitectura de FieldSales CRM y sus límites entre dominios, capas hexagonales, aplicaciones e infraestructura. Usar al evaluar un diff, una historia transversal, una dependencia entre módulos, un cambio estructural o la necesidad de un ADR.
---

# Revisar arquitectura

## Preparar el alcance

1. Leer la historia y el diff objetivo.
2. Identificar aplicaciones, dominios y contratos modificados.
3. Consultar solo las secciones aplicables de `shared/PROJECT_CONTEXT.md`,
   `shared/ENGINEERING_RULES.md` y `docs/architecture/`.
4. Usar `rg` sobre imports, paquetes y llamadas antes de abrir módulos completos.

## Validar

- Mantener el Backend como monolito modular durante el MVP.
- Conservar `domain`, `application`, `adapter` y `config` por dominio.
- Impedir que `domain` dependa de Spring, persistencia, transporte o mensajería.
- Impedir acceso directo a repositorios o tablas internas de otro dominio.
- Exigir puertos explícitos, eventos internos o contratos públicos entre módulos.
- Mantener PostgreSQL como fuente de verdad y Redis como estado efímero.
- Verificar segregación por tenant en persistencia, cache, eventos y WebSocket.
- Verificar compatibilidad y versionado de REST, eventos y sincronización.
- Solicitar ADR si cambia un límite de dominio, librería estructural, proveedor,
  protocolo, persistencia, autenticación o estrategia multiempresa.

Ejecutar `HexagonalArchitectureTest` y `ModuleBoundaryTest` cuando el diff afecte
paquetes o dependencias Backend. No ejecutar la suite completa por defecto.

## Entregar

Reportar primero hallazgos con severidad, archivo y evidencia. Después indicar
límites revisados, validaciones ejecutadas, ADR requerido/no requerido y riesgo
residual. No repetir la documentación fuente ni proponer microservicios sin una
necesidad aprobada.
