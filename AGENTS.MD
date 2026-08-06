# FollowUpBussiness — Instrucciones globales

## Modo MVP ligero — regla predominante

El objetivo es entregar historias seguras y comprobables con el menor contexto
posible. Esta sección prevalece sobre cualquier instrucción más detallada de
flujo o plantilla.

### Carga de contexto

En un flujo `Desarrollo → QA → Seguridad → DoF`, solo el Orquestador lee la HU
y las fuentes primarias al inicio. Busca primero por ID, endpoint o símbolo y
abre únicamente las secciones aplicables. El paquete canónico contiene criterios
normalizados, decisiones y rutas; no copia documentos ni guarda hashes por
fuente.

Cada agente de fase recibe con contexto limpio únicamente:

- ruta del paquete;
- `Candidate-ID`;
- handoff inmediatamente anterior;
- alcance de la fase y estado esperado.

No recibe el historial de conversación ni relee HU, contrato, ADR o documentos
compartidos. Puede abrir una fuente primaria solo si el paquete es ambiguo, el
candidato revela una superficie no descrita o existe una contradicción. Registra
motivo, ruta y sección; no vuelve a resumir la fuente.

Fuera del flujo orquestado, leer la historia, el `AGENTS.MD` local de la
aplicación y el diff/pruebas relacionados. Consultar contrato, contexto, ADR y
documentación técnica solo por referencia concreta. Usar `rg` antes de abrir
archivos grandes.

### Artefactos mínimos

Por HU se permiten únicamente:

1. un paquete de contexto;
2. un handoff Dev;
3. un handoff QA;
4. un informe final de Seguridad cuando aplique;
5. un informe DoF.

El preflight, si es necesario, vive como una sección breve del paquete o del
informe de Seguridad; no crea otro artefacto. Un bloqueo previo a una fase se
anota en el estado vigente del paquete.

Para el mismo candidato se reemplaza el estado vigente: no se agrega una
revisión por transición, reintento, bloqueo repetido, corrección de metadatos o
revalidación. Se registra un delta breve solo cuando cambia el candidato, el
alcance, un contrato, un dato sensible o una amenaza. Git conserva el historial.

Paquete y handoffs contienen solo IDs, decisiones, rutas, comandos/resultados
resumidos, hallazgos y pendientes. No incluyen logs, código, contenido de
fuentes, listas de hashes ni narrativa histórica.

### Candidato y gates

El `Candidate-ID` es el commit objetivo o, antes del commit, `HEAD + digest
corto del diff`. Se calcula una vez cuando Desarrollo cambia código. No se
crean manifiestos con hashes por archivo. QA, Seguridad y DoF comparan el ID y
una firma rápida basada en `git status --porcelain` o el commit.

Un gate valida únicamente:

- artefacto previo existente;
- HU y estado permitido;
- mismo `Candidate-ID`.

Campos descriptivos, versiones administrativas, tablas o citas ausentes son
advertencias si no generan ambigüedad sobre esos tres datos. El Orquestador
corrige metadatos en la misma transición, sin crear un gate ni turno adicional.

### Verificación proporcional

- Desarrollo ejecuta pruebas del cambio y regresión directa.
- QA valida independientemente criterios afectados, un negativo relevante y
  regresión directa; amplía solo si el diff o un fallo lo justifica.
- Seguridad interviene cuando cambia autenticación/autorización, tenant, datos
  personales o ubicación, secretos, exposición pública, archivos, pagos o
  infraestructura. En otro caso registra `NOT_APPLICABLE` en una frase.
- El preflight solo se usa ante una decisión de seguridad o contrato ambigua
  antes de implementar y define como máximo cinco controles. No se repite en
  remediaciones que no amplíen el riesgo.
- Seguridad final reutiliza QA y reproduce solo un abuso capaz de cambiar su
  decisión.
- DoF no relee fuentes ni repite suites. Comprueba estados de fase, candidato,
  ausencia de hallazgos bloqueantes, pruebas/CI declaradas y
  `git diff --check`. PR o CI bloquean solo si son obligatorios para integrar.

Tras `CHANGES_REQUIRED`: `Dev afectado → QA afectado → Seguridad final`. No
se reinician fases aprobadas ni se releen controles no afectados.

### Presupuesto operativo por fase

Una sesión de fase ejecuta el rol directamente; no crea otro agente del mismo
rol. La independencia se obtiene usando sesiones separadas. Agrupar búsquedas,
lecturas y clases de prueba en el menor número de llamadas posible; Maven se
ejecuta en modo silencioso y solo se abren reportes detallados si falla.

- QA: máximo orientativo de 10 llamadas de herramienta y 2 comandos de prueba.
- Seguridad: máximo 8 llamadas y 1 reproducción de abuso.
- DoF: máximo 6 llamadas; no ejecuta pruebas ni abre código.
- Remediación solo de pruebas: máximo 12 llamadas y 2 comandos de prueba.

Superar un límite requiere una contradicción o riesgo nuevo y debe explicarse;
no se amplía el alcance para recopilar evidencia redundante. QA, Seguridad, DoF
y una remediación solo de pruebas no usan Graphify.

Antes de Desarrollo, las historias de autorización, tenant, roles, auditoría,
migraciones o transacciones fijan como máximo cinco invariantes: actor/recurso,
éxito, denegación, conflicto y fallo/rollback. Si falta vocabulario público o
semántica para uno de ellos, se bloquea antes de escribir código. Así no se
descubren decisiones contractuales durante Seguridad final.

Tras una remediación, Desarrollo entrega las pruebas exactas solicitadas. Si el
cambio es solo de pruebas, no reabre producción, arquitectura ni contratos a
menos que la prueba nueva falle. Dos `CHANGES_REQUIRED` consecutivos sobre la
misma superficie detienen el rebote y obligan a consolidar contrato, defecto y
prueba faltante antes de continuar.

## Organización

- `backend/`: Java y Spring Boot.
- `frontend/`: React y TypeScript.
- `mobile/`: Flutter.
- `infrastructure/` y `docker-compose.yml`: infraestructura compartida.

## Principios no negociables

- No inventar reglas de negocio.
- Preservar trazabilidad e aislamiento multiempresa.
- No incluir secretos ni datos personales en código, logs o evidencias.
- Crear ADR solo para cambios reales de arquitectura.
- No modificar fuera del alcance ni sobrescribir cambios ajenos.
- Ningún agente aprueba su propio trabajo.

## Flujo y estados

1. Desarrollo: `READY_FOR_HANDOFF` o `BLOCKED`.
2. QA independiente: `PASS`, `CHANGES_REQUIRED` o `BLOCKED`.
3. Seguridad, si aplica: `PASS`, `CHANGES_REQUIRED`, `BLOCKED` o
   `NOT_APPLICABLE`. Preflight: `ADVISORY`.
4. DoF: `PASS` o `BLOCKED`.

No se inicia una fase si el estado previo no la autoriza. QA o Seguridad con
`CHANGES_REQUIRED`/`BLOCKED` no autorizan DoF. Una respuesta de chat no
sustituye el artefacto canónico, pero el Orquestador puede transcribir
literalmente el dictamen de un revisor de solo lectura sin reinterpretarlo.

## Git

- Una rama por historia.
- Commits separados por aplicación cuando corresponda.
- Pull requests trazables cuando el flujo de integración los use.
- Los agentes no hacen commits salvo solicitud explícita.
- DoF termina al emitir su dictamen. Commit, push, PR y merge son una operación
  de Release posterior y no se contabilizan ni documentan como DoF.

## graphify

Usar Graphify solo ante `/graphify` explícito o una pregunta amplia de
arquitectura, dependencias, relaciones o impacto cuyo alcance no se conozca.
No usarlo para una fase rutinaria con archivos conocidos, QA focalizado,
Seguridad, DoF, Git o Release. Cuando aplique, ejecutar una única consulta:

- `graphify query "<pregunta>"`
- `graphify path "<A>" "<B>"` para relaciones.
- `graphify explain "<concepto>"` para un concepto.

No leer `GRAPH_REPORT.md` salvo revisión arquitectónica amplia o insuficiencia
de la consulta. Desarrollo actualiza el grafo como máximo una vez al terminar
un cambio de código de producción; cambios de pruebas o documentación no lo
requieren y un grafo desactualizado nunca bloquea una fase.
