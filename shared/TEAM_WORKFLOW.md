# Flujo operativo entre agentes — MVP

`AGENTS.MD` es la fuente de verdad. Este archivo solo resume la ejecución y no
se carga en cada fase salvo ambigüedad.

## Flujo

1. El Orquestador crea un paquete breve leyendo una vez la HU y referencias
   aplicables.
2. Desarrollo implementa y ejecuta pruebas dirigidas.
3. QA independiente valida criterios afectados y regresión directa.
4. Seguridad revisa solo superficies de riesgo; de lo contrario es
   `NOT_APPLICABLE`.
5. DoF verifica estados, candidato y evidencia ya producida.

Cada fase recibe paquete, `Candidate-ID`, handoff anterior, alcance y estado
esperado con contexto limpio. No recibe el historial ni vuelve a leer fuentes
primarias ya resumidas.

## Economía

- Un archivo canónico por tipo de salida, sin variantes `-vN`.
- Para el mismo candidato se reemplaza el estado vigente.
- No hashes por fuente ni manifiestos por archivo.
- No logs, código, matrices repetidas o narrativa histórica en handoffs.
- No suites completas por defecto.
- No repetir preflight o fases no afectadas.
- Detener el análisis cuando un bloqueo concluyente ya determina el estado.
- Ejecutar el rol directamente en su sesión; no crear un agente del mismo rol.
- Agrupar lecturas y pruebas: QA ≤10 llamadas/2 comandos, Seguridad ≤8/1 abuso,
  DoF ≤6/sin pruebas, remediación de tests ≤12/2 comandos, salvo riesgo nuevo.
- No usar Graphify en QA, Seguridad, DoF ni remediación solo de pruebas.
- Tras dos rebotes sobre la misma superficie, detener y consolidar contrato,
  defecto y prueba antes de continuar.

## Gates

El gate comprueba solamente archivo existente, HU/estado permitido y mismo
`Candidate-ID`. Omisiones descriptivas son advertencias. Un cambio de
candidato invalida solo la evidencia afectada.

Ruta normal:

`Dev READY_FOR_HANDOFF → QA PASS → Seguridad PASS/NOT_APPLICABLE → DoF`.

Ruta de corrección:

`Dev afectado → QA afectado → Seguridad final si aplica → DoF`.

DoF y Release son actividades distintas: commit, push, PR y merge no forman
parte de la verificación DoF.

## Entrega mínima por fase

- Dev: alcance, cambio, pruebas, candidato, riesgos y estado.
- QA: casos/comandos, resultados, defectos, riesgos y estado.
- Seguridad: superficie, abuso decisivo, hallazgos y estado.
- DoF: estados recibidos, candidato, verificaciones finales y decisión.
