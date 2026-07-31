
# Mobile — Instrucciones locales

## Contexto

- Aplicar `../../AGENTS.MD`.
- Leer completa la historia Mobile indicada.
- Abrir solo los contratos REST y de sincronización afectados.
- Inspeccionar primero el diff, la feature, persistencia y cola relacionadas.

## Invariantes

- La aplicación es offline-first.
- Visitas y ventas no deben perderse.
- Toda operación offline sensible utiliza un identificador estable y reintentos
  idempotentes.
- El servidor realiza la validación final de geocerca.
- Rastrear solo durante jornada activa, mostrar el estado y detener servicios al
  cerrar la jornada.
- Almacenar tokens de forma segura.
- Los datos locales deben segregarse por usuario y empresa.
- Una visita activa y la cola pendiente deben sobrevivir al reinicio.
- No mostrar un registro como sincronizado hasta recibir confirmación.
- No registrar tokens, documentos ni coordenadas completas.

## Verificación

Ejecutar primero `flutter analyze` y las pruebas dirigidas. Ampliar a toda la
suite o pruebas de dispositivo cuando el riesgo lo requiera. Incluir al menos los
estados offline/reintento relevantes y resumir la evidencia.
