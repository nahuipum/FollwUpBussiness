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
