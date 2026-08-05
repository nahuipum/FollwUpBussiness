# DoF — BE-005

## Estado

`BLOCKED`

## Evidencia de cierre

- Paquete aplicable: v1 y v3; `HEAD` observado `3a787569ca873f084e0b6f0e052988933935cda7`; diff tracked observado `e8dcefa3429d97438453a700dbf0161565e504f7`; `git diff --check HEAD` pasa.
- Desarrollo está `BLOCKED`; QA v3 está `BLOCKED`; Seguridad final v3 está `BLOCKED`. Por tanto no hay la secuencia de estados requerida `READY_FOR_HANDOFF` → `PASS` → `PASS` sobre un mismo candidato.
- El candidato no es inmutable ni completo: contiene nueve archivos funcionales BE-005 no rastreados. Seguridad registra un snapshot auxiliar distinto (`aed58500f7ccd3ef868b750d4e213d04f403edf4`), por lo que la huella tracked no identifica todos los archivos revisados/probados.
- No hay evidencia de commit BE-005, PR trazable ni CI aprobada para un commit candidato. `HEAD` es el merge PR #10 de BE-004; el paquete v3 también declara que el candidato no incluye commit ni PR.

## Condiciones exactas de desbloqueo

1. Producto/Arquitectura debe proporcionar el contrato público para presencia/notificaciones requerido por SEC-BE005-12 y el ADR si cambia límites; implementar y probar la desvinculación/revocación por ese puerto, sin tablas internas ajenas.
2. Remediar y aportar pruebas trazables al nuevo candidato para: CA-01/SEC-BE005-06 (reintento HTTP current devuelve 204 neutral); CA-04/SEC-BE005-09 (auditoría técnica saneada en denegación/fallo, sin que su indisponibilidad revierta la revocación); SEC-BE005-07 (5/h sólo global, con efecto dedupe/alerta/backoff no bloqueante, sexta llamada y Redis caído); SEC-BE005-05 (carrera refresh/logout en ambos órdenes); SEC-BE005-11 (dos tenants y Redis stale sin reactivación). Corregir además la discrepancia 49/49 frente a 48 pruebas reproducidas.
3. Fijar un candidato inmutable que incluya todos los archivos funcionales y de prueba (commit y manifiesto/huella integral); generar un nuevo paquete de contexto si cambia el candidato.
4. Sobre esa misma huella, obtener handoffs nuevos: Desarrollo `READY_FOR_HANDOFF`, QA `PASS` y Seguridad final `PASS`, con los controles y criterios aplicables cubiertos.
5. Aportar PR trazable y resultado CI aprobatorio para el commit candidato. No se creó commit ni PR durante esta revisión.

---

## Decisión DoF v16 — F14-01 y F14-02 (2026-08-05)

### Estado

`BLOCKED`

### Gates/evidencia faltantes

- Falta un commit candidato revisable que contenga las 31 rutas funcionales fijadas por el manifiesto v16. La identidad verificada sigue siendo `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` más un diff de trabajo `524f08838e6f2b4f8719bdd0bbf67309156082bd`; el commit `HEAD` no contiene ese diff.
- Falta un PR trazable asociado a ese commit candidato.
- Falta un resultado de CI aprobatorio asociado al mismo commit candidato. Los handoffs v16 no aportan identificador/enlace de ejecución CI para esa identidad.
