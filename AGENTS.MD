# FollowUpBussiness — Instrucciones globales

## Fuentes de verdad y carga de contexto

### Flujo orquestado por historia

Para el flujo `Desarrollo → QA → Seguridad → DoF`, el **Agente Orquestador**
es el único que ingiere la historia y los documentos de referencia al comenzar
la historia. Debe crear un *Paquete de Contexto de Historia* canónico, con
criterios normalizados, reglas aplicables, rutas/secciones, hashes y el commit
candidato. Los agentes de fase reciben ese paquete y el handoff anterior por
referencia; no reciben el historial de conversación ni vuelven a leer la HU,
contratos o ADR ya incluidos.

Una relectura de una fuente primaria está permitida únicamente si:

- el paquete cita una sección ambigua o insuficiente;
- el diff o el riesgo revela una fuente no identificada;
- cambió la fuente o el commit candidato; o
- la evidencia de una fase contradice el paquete.

Quien realice la excepción debe registrarla en el handoff con motivo, ruta,
sección y hash. Si una fuente o el candidato cambia materialmente, el
Orquestador añade una revisión al paquete canónico antes de avanzar de fase;
no crea otro archivo solo para numerar la revisión.

Fuera de un flujo orquestado, leer siempre:

1. La historia indicada en `docs/stories/`.
2. El `AGENTS.MD` local de la aplicación afectada.
3. El diff, código y pruebas relacionados con la historia.

Consultar de forma selectiva:

- `00_CONTRATO_FUNCIONAL.md`: buscar y leer solo las reglas o requerimientos
  citados por la historia. Leerlo completo únicamente si el alcance es
  transversal o existe una contradicción.
- `shared/PROJECT_CONTEXT.md`, `shared/ENGINEERING_RULES.md` y
  `shared/TEAM_WORKFLOW.md`: leer las secciones aplicables al rol y componente.
- `docs/api/`, `docs/events/` y `docs/sync/`: abrir solo los
  contratos afectados. No recorrer directorios completos sin una razón concreta.
- ADR y documentación de seguridad: cargar los archivos vinculados por la
  historia, el código o el riesgo observado.

Usar `rg` para localizar IDs funcionales, endpoints, eventos y símbolos antes de
abrir documentos grandes. No copiar fuentes completas al handoff; citar rutas,
secciones y evidencia.

### Artefactos canónicos y economía de salida

- Usar un único `docs/handoffs/governance/<HU>-context-package.md` por HU. Sus
  revisiones son secciones append-only con identidad, causa, hashes y alcance
  invalidado/reutilizable; el cuerpo vigente se actualiza en ese archivo.
- Usar un único handoff por fase y aplicación. Las remediaciones y
  revalidaciones se agregan como secciones al handoff canónico de esa fase.
- No crear un `.md` para una comprobación de gate que no inicia fase: registrar
  el bloqueo y el faltante en el **Registro de gates** del paquete canónico.
- Crear un archivo nuevo solo si aparece un tipo de artefacto distinto o una
  política externa exige una entrega inmutable separada. Una corrección de
  metadatos, un estado o un número de revisión no justifican otro archivo.

## Organización

- `backend/`: Java y Spring Boot.
- `frontend/`: React y TypeScript.
- `mobile/`: Flutter.
- `infrastructure/` y `docker-compose.yml`: infraestructura compartida.

## Principios no negociables

- No inventar reglas de negocio.
- Preservar trazabilidad e aislamiento multiempresa.
- No incluir secretos ni datos personales en código, logs o evidencias.
- Crear un ADR para cambios de arquitectura.
- No modificar fuera del alcance sin documentarlo.
- No sobrescribir cambios ajenos del worktree.
- Ningún agente aprueba su propio trabajo.

## Flujo y roles

1. Historia refinada y contratos definidos.
2. El Orquestador solicita un preflight de Seguridad cuando la matriz de riesgo
   aplica. El preflight define controles `SEC-<HU>-NN` verificables, pero no
   aprueba código ni sustituye la revisión final.
3. Desarrollo implementa y prueba cada control aplicable.
4. QA independiente valida criterios y controles `SEC-*` usando el paquete y
   el candidato fijado.
5. Ciberseguridad realiza la revisión final cuando la matriz de riesgo aplica;
   en otro caso
   registra `NOT_APPLICABLE` con justificación.
6. DoF comprueba las evidencias de las fases y decide el cierre.

No ejecutar roles posteriores antes de disponer del documento de salida
requerido de la fase anterior. El Orquestador debe verificar en disco que el
documento existe, no está vacío y declara la misma HU, paquete/version y
candidato; una respuesta de chat no sustituye ese artefacto. Si falta o no
coincide, la fase queda `BLOCKED` y no se puede invocar ni sugerir el rol
siguiente. QA `CHANGES_REQUIRED`/`BLOCKED` retorna a Desarrollo; Seguridad
`CHANGES_REQUIRED`/`BLOCKED` activa únicamente la remediación acotada. Ninguno
de esos estados autoriza Seguridad final, DoF ni cierre.
No repetir suites o análisis ya evidenciados salvo que el riesgo, el diff o un
resultado inconsistente lo justifique.
El Orquestador no aprueba ni modifica la historia: prepara y distribuye el
contexto mínimo, fija el candidato y hace cumplir los gates.
Un `CHANGES_REQUIRED` o `BLOCKED` de Seguridad no reinicia la historia: activa
la ruta de remediación limitada a los controles y superficies afectadas.

## Estados permitidos

- Desarrollo: `READY_FOR_HANDOFF` o `BLOCKED`.
- QA: `PASS`, `CHANGES_REQUIRED` o `BLOCKED`.
- Seguridad final: `PASS`, `CHANGES_REQUIRED`, `BLOCKED` o `NOT_APPLICABLE`.
- Preflight de Seguridad: `ADVISORY` o `NOT_APPLICABLE`; no es una aprobación.
- DoF: `PASS` o `BLOCKED`.

## Git

- Una rama por historia.
- Commits separados por aplicación.
- Pull requests trazables.
- Los agentes no realizan commits salvo solicitud explícita del usuario.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
