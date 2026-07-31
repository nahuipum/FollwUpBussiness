# Flujo operativo entre agentes

## 0. Política de eficiencia

- Trabajar una historia y una fase por solicitud.
- No iniciar todos los agentes por defecto. Invocar solo el agente de la
  aplicación afectada y avanzar al siguiente gate mediante su handoff.
- Entregar a cada revisor: historia, diff o commit objetivo, handoff anterior y
  rutas de evidencia. No reenviar el historial completo de conversación.
- Leer documentos grandes por ID o sección. Evitar recorridos generales del
  repositorio cuando el alcance ya está identificado.
- Ejecutar primero pruebas dirigidas al cambio. Ampliar a regresión completa
  cuando el riesgo sea transversal, fallen pruebas dirigidas o el gate lo exija.
- Reutilizar resultados verificables de CI. No volver a ejecutar una suite
  costosa si el código objetivo no cambió y la evidencia identifica commit,
  comando y resultado.
- Mantener handoffs breves: no pegar logs completos, código ni documentos.
  Registrar comando, resultado, ruta de evidencia, hallazgos y pendientes.
- Detener la fase al encontrar un bloqueo concluyente; no consumir contexto en
  revisiones secundarias que no puedan cambiar el estado.

## 1. Entrada mínima de una historia

Una historia debe contener:

- Identificador.
- Actor.
- Necesidad.
- Valor.
- Reglas aplicables.
- Criterios de aceptación.
- Fuera de alcance.
- Datos.
- Dependencias.
- Riesgos conocidos.
- Diseños o contrato, si aplican.

---

## 2. Fase de análisis

### Desarrollo

Cada agente identifica:

- Componentes afectados.
- Contratos necesarios.
- Cambios de datos.
- Riesgos técnicos.
- Estrategia de pruebas.
- Dependencias entre plataformas.

### QA

QA transforma criterios de aceptación en:

- Casos felices.
- Casos negativos.
- Límites.
- Concurrencia.
- Permisos.
- Recuperación.
- Regresión.

### Seguridad

Determina si requiere:

- Threat model.
- Revisión de autenticación.
- Revisión de datos personales.
- Revisión de geolocalización.
- Revisión de archivo.
- Revisión de dependencia.
- Prueba de abuso.

---

## 3. Orden de contratos

Para funcionalidades compartidas:

1. Se define el comportamiento funcional.
2. Backend propone OpenAPI, eventos y modelo de sincronización.
3. Frontend y Mobile revisan consumibilidad.
4. QA crea pruebas de contrato.
5. Se aprueba el contrato.
6. Las plataformas implementan en paralelo.

El contrato no debe modificarse silenciosamente para acomodar una implementación.

---

## 4. Handoff de Desarrollo a QA

Debe incluir:

- Historia y criterios cubiertos.
- Archivos o módulos modificados.
- Endpoint/evento/pantalla.
- Migraciones.
- Flags.
- Datos de prueba.
- Casos cubiertos.
- Casos no cubiertos.
- Riesgos.
- Evidencia CI.
- Instrucciones para reproducir.
- Impacto de seguridad.

El handoff debe identificar el diff o commit revisable y limitarse a información
nueva de la historia. Las reglas permanentes permanecen en sus fuentes de verdad.

---

## 5. Handoff de QA

QA entrega:

- Matriz criterio → prueba.
- Ambiente y versión.
- Resultados.
- Evidencia.
- Defectos.
- Regresión ejecutada.
- Riesgos residuales.
- Estado `PASS`, `CHANGES_REQUIRED` o `BLOCKED`.

---

## 6. Handoff de seguridad

Seguridad entrega:

- Superficie revisada.
- Hallazgos.
- Severidad.
- Evidencia.
- Escenario de abuso.
- Recomendación.
- Estado de remediación.
- Riesgo aceptado, solo con responsable.

Seguridad es obligatoria si el cambio afecta autenticación, autorización,
aislamiento multiempresa, datos personales, geolocalización, almacenamiento
local, archivos, dependencias, secretos, APIs públicas, WebSocket, Redis,
RabbitMQ, infraestructura o CI/CD. En ausencia de estas superficies puede emitir
`NOT_APPLICABLE` con una justificación breve basada en el diff.

---

## 7. Validación DoF

DoF no vuelve a desarrollar ni sustituye a QA.

Valida:

- Trazabilidad.
- Cumplimiento funcional.
- Integración.
- Pruebas.
- Seguridad.
- Documentación.
- Operabilidad.
- Despliegue.
- Evidencias.

Si falta evidencia, el resultado es `BLOCKED`, aunque el código parezca correcto.
