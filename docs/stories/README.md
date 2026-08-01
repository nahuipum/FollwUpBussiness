# Backlog de historias

| Área | Cantidad |
|---|---:|
| Backend | 62 |
| Frontend | 38 |
| Mobile | 32 |
| Integración E2E | 40 |
| **Historias** | **172** |
| Enablers | 10 |
| **Total backlog trazado** | **182** |

## Cómo leer el backlog

1. `BACKLOG_REFINEMENT.md` explica el flujo de producto y las decisiones.
2. `sprint-map.md` define el orden de entrega y las puertas de salida.
3. `dependency-map.md` muestra predecesoras y consecuentes de cada elemento.
4. `CONTRACT_READINESS.md` identifica contratos que aún no están listos.
5. Cada HU repite su secuencia, contratos, datos, riesgos y puerta de Ready.
6. Una historia de plataforma solo se cierra con QA independiente y la
   historia de integración correspondiente.

## Regla de planificación

Una pantalla no entra al sprint si no existe productor de datos real,
contrato estable o mock acordado. Un backend no se considera capacidad
terminada si no tiene consumidor o validación vertical explícita.
