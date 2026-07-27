# Flujo operativo entre agentes

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
