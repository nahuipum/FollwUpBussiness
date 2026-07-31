# FieldSales CRM — Instrucciones globales

## Fuentes de verdad y carga de contexto

Leer siempre:

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
2. Desarrollo implementa y prueba.
3. QA independiente valida.
4. Ciberseguridad revisa cuando la matriz de riesgo lo requiera; en otro caso
   registra `NOT_APPLICABLE` con justificación.
5. DoF comprueba evidencias y decide el cierre.

No ejecutar roles posteriores antes de disponer del handoff de la fase anterior.
No repetir suites o análisis ya evidenciados salvo que el riesgo, el diff o un
resultado inconsistente lo justifique.

## Estados permitidos

- Desarrollo: `READY_FOR_HANDOFF` o `BLOCKED`.
- QA y Seguridad: `PASS`, `CHANGES_REQUIRED`, `BLOCKED` o `NOT_APPLICABLE`.
- DoF: `PASS` o `BLOCKED`.

## Git

- Una rama por historia.
- Commits separados por aplicación.
- Pull requests trazables.
- Los agentes no realizan commits salvo solicitud explícita del usuario.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `$graphify` (or `/graphify`), use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `python -m graphify query "<question>"` when graphify-out/graph.json exists. Use `python -m graphify path "<A>" "<B>"` for relationships and `python -m graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `python -m graphify update .` to keep the graph current (AST-only, no API cost).
