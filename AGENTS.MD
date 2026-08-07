# FollowUpBussiness — Instrucciones globales

## Modo MVP ligero — regla predominante

El objetivo es entregar historias seguras y comprobables con el menor contexto
posible. Esta sección prevalece sobre cualquier instrucción más detallada de
flujo o plantilla.

### Carga de contexto

En `Desarrollo → QA → Seguridad → DoF`, solo el Orquestador lee al inicio la HU
y las secciones aplicables, buscadas primero por ID, endpoint o símbolo. Resume
criterios, decisiones y rutas en el paquete; no copia fuentes ni sus hashes.

Cada agente de fase recibe con contexto limpio únicamente:

- ruta del paquete;
- `Candidate-ID`;
- handoff inmediatamente anterior;
- alcance de la fase y estado esperado.

No recibe historial ni relee HU, contrato o ADR. Abre una fuente solo ante
ambigüedad, superficie nueva o contradicción y registra motivo, ruta y sección.

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

El preflight vive como sección breve del paquete o informe de Seguridad; no crea
otro artefacto. Un bloqueo previo se anota en el paquete vigente.

Para el mismo candidato se reemplaza el estado vigente. Solo se registra delta
si cambia candidato, alcance, contrato, dato sensible o amenaza; Git conserva
el historial.

Paquete y handoffs solo contienen IDs, decisiones, rutas, resultados resumidos,
hallazgos y pendientes; no logs, código, fuentes copiadas ni narrativa histórica.

Límites orientativos: paquete de contexto de hasta 900 palabras, handoffs Dev,
QA y Seguridad de hasta 300 palabras cada uno, e informe DoF de hasta 150
palabras. Si el alcance exige excederlos, se enlaza la fuente o prueba en vez de
copiarla y se explica la excepción en una línea.

### Candidato y gates

El `Candidate-ID` es el commit objetivo o, antes del commit, `HEAD + digest
corto del diff`. Se calcula una vez cuando Desarrollo cambia código. No se
crean manifiestos con hashes por archivo. QA, Seguridad y DoF comparan el ID y
una firma rápida basada en `git status --porcelain` o el commit.

El paquete mantiene un único `Candidate-ID vigente`; al cambiar, reemplaza el
anterior y añade solo el delta. El candidato pre-Desarrollo no sigue activo.

Un gate valida únicamente:

- artefacto previo existente;
- HU y estado permitido;
- mismo `Candidate-ID`.

Omisiones descriptivas son advertencias si esos tres datos son inequívocos. El
Orquestador corrige metadatos sin crear gate ni turno adicional.

### Verificación proporcional y paridad de integración

- Desarrollo ejecuta pruebas dirigidas y regresión directa. Antes del primer
  handoff añade una sola validación local de integración si cambia composición
  compartida: contexto/beans, seguridad, configuración, migraciones,
  transacciones, serialización, fixtures, dependencias o build. Usa `clean
  verify` silencioso en Backend y el equivalente de CI en Frontend/Mobile; QA y
  Seguridad reutilizan el resultado.
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
- DoF se ejecuta una vez sobre el candidato final. Comprueba estados, candidato,
  hallazgos, validación aplicable y `git diff --check`; no relee ni repite
  suites. Si CI obligatorio carece de equivalente local, espera su resultado.

Tras `CHANGES_REQUIRED`: `Dev afectado → QA afectado`. Seguridad solo se reabre
si cambia superficie sensible, amenaza/control o evidencia decisiva. Para tests,
documentación o metadatos no sensibles se registra `NOT_APPLICABLE` en una
frase. DoF no se ejecuta entre remediaciones.

### Presupuesto operativo por fase

Un chat genérico solo orquesta e invoca la fase con `fork_turns: "none"`; una
sesión especializada ejecuta su rol sin anidarlo. Agrupa lecturas y pruebas,
usa Maven silencioso y abre reportes detallados solo si falla.

- QA: máximo orientativo de 10 llamadas de herramienta y 2 comandos de prueba.
- Seguridad: máximo 8 llamadas y 1 reproducción de abuso.
- DoF: máximo 6 llamadas; no ejecuta pruebas ni abre código.
- Remediación solo de pruebas: máximo 12 llamadas y 2 comandos de prueba.

Por HU: una ejecución inicial por rol y como máximo una vuelta `Dev → QA`; no
más de 7 sesiones incluyendo Orquestación. Una segunda corrección o la sesión 8
detiene el flujo hasta consolidar causa, condición de cierre y comando.

Cada fase abre solo paquete, handoff anterior, diff y archivos/pruebas afectados.
Otra fuente exige ambigüedad, contradicción o riesgo nuevo registrado. No abre
árboles, documentos completos, logs ni reportes exitosos como contexto general.

Superar un límite requiere una contradicción o riesgo nuevo y debe explicarse;
no se amplía el alcance para recopilar evidencia redundante. QA, Seguridad, DoF
y una remediación solo de pruebas no usan Graphify.

- Antes de Dev, historias de autorización, tenant, roles, auditoría, migraciones
  o transacciones fijan hasta cinco invariantes: actor/recurso, éxito,
  denegación, conflicto y fallo/rollback. Falta de semántica pública bloquea.
- Cada rechazo/no-op define respuesta, escrituras/revocaciones,
  eventos/auditoría y credenciales/sesiones. Enumera puertos alcanzables; texto
  libre define política por sink: omitir, marcador o categoría aprobada.
- Dev mantiene en memoria control→prueba y verifica ausencia de todos los
  efectos prohibidos antes del primer handoff.
- QA recorre toda la superficie y consolida hallazgos en un solo dictamen; solo
  corta ante Critical/High. La revalidación cubre la corrección, no criterios
  nuevos sin riesgo o contradicción aparecidos en el delta.
- En remediación, Dev ejecuta la prueba solicitada y, si falló CI/suite
  compartida, el comando fallido completo. Un cambio solo de tests no reabre
  producción, arquitectura ni contratos salvo que la prueba falle.
- Seguridad final no reabre controles conocidos. Un hallazgo nuevo identifica
  amenaza no cubierta y condición observable de cierre.

## Organización

- `backend/`: Java y Spring Boot.
- `frontend/`: React y TypeScript.
- `mobile/`: Flutter.
- `infrastructure/` y `docker-compose.yml`: infraestructura compartida.

### Referencia visual en Desarrollo Frontend

Solo al desarrollar una HU Frontend, buscar primero el mockup HTML exacto por
ID en `docs/frontendMockups/` (por ejemplo, `FE-001.html`). Si existe, es la
referencia visual de la implementación. Si no existe, revisar los mockups HTML
ya disponibles para conservar sus patrones y el agente puede crear
`docs/frontendMockups/<HU-ID>.html` como propuesta estática coherente. El
mockup no crea reglas de negocio ni sustituye los criterios, contratos o
requisitos de accesibilidad de la HU.

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
