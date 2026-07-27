# Reglas de ingeniería compartidas

## 1. Calidad del código

Todo cambio debe:

- Ser pequeño y trazable a una historia.
- Mantener nombres claros.
- Evitar duplicación relevante.
- Evitar clases o componentes con responsabilidades múltiples.
- Incluir manejo explícito de errores.
- Preservar compatibilidad o documentar la ruptura.
- No introducir secretos.
- No dejar código comentado ni TODO sin ticket.
- Incluir documentación solo donde aporte contexto no evidente.

---

## 2. Git y pull requests

Cada pull request debe:

- Referenciar una historia.
- Tener alcance único.
- Incluir pruebas.
- Incluir migraciones cuando correspondan.
- Indicar riesgos.
- Indicar rollback.
- Actualizar contratos.
- Pasar CI.
- No contener credenciales.
- No mezclar refactor amplio con una funcionalidad salvo justificación.

Commits recomendados:

```text
feat(visits): validate check-in geofence
fix(sync): prevent duplicate offline sales
test(routes): cover route assignment conflicts
docs(api): update visit endpoint contract
```

---

## 3. Base de datos

- Todas las modificaciones usan migraciones versionadas.
- Las migraciones deben ser repetibles en entornos limpios.
- No se modifica una migración ya desplegada.
- Agregar índices a consultas críticas.
- Probar migraciones con datos representativos.
- Evitar bloqueos prolongados.
- Mantener tenant_id en entidades multiempresa.
- Toda consulta debe respetar tenant_id.
- PostGIS debe utilizar SRID consistente.
- Documentar unidades de distancia.

---

## 4. API

- Validación de entrada.
- Respuestas tipadas.
- Errores consistentes.
- No filtrar información sensible en mensajes.
- Autorización por recurso, no solo por endpoint.
- Paginación obligatoria en colecciones grandes.
- Idempotencia en comandos móviles.
- Fechas en ISO 8601.
- Dinero con decimal, nunca float.
- Coordenadas con precisión definida.
- Contrato actualizado antes del handoff.

---

## 5. Frontend y mobile

- Type safety.
- Estados de carga, vacío, error y sin permiso.
- No asumir conectividad.
- No asumir que el WebSocket está conectado.
- Mostrar “última actualización”.
- Accesibilidad.
- Mensajes comprensibles.
- No almacenar tokens en mecanismos inseguros.
- No registrar datos personales en consola.
- No mostrar datos de otro tenant por cache o estado residual.

---

## 6. Pruebas mínimas

Según la historia:

- Unitarias.
- Integración.
- Contrato.
- Persistencia.
- Seguridad.
- UI.
- E2E.
- Offline.
- Reintento.
- Concurrencia.
- Compatibilidad.
- Regresión.

Una prueba debe verificar comportamiento observable, no detalles internos innecesarios.

---

## 7. Observabilidad

Cada flujo crítico debe permitir seguir:

- correlationId.
- tenantId, con tratamiento seguro.
- userId técnico.
- operation.
- result.
- latency.
- errorType.

No registrar:

- Contraseñas.
- Tokens.
- Documentos completos.
- Datos de tarjetas.
- Coordenadas innecesarias.
- Payloads completos con datos personales.

---

## 8. Criterios para ADR

Crear ADR cuando se decida o cambie:

- Broker.
- Proveedor de mapas.
- Estrategia multi-tenant.
- Autenticación.
- Persistencia local móvil.
- Protocolo WebSocket.
- Motor de rutas.
- Política de retención.
- Librería estructural.
- Cambio de dominio.
- Integración externa crítica.
