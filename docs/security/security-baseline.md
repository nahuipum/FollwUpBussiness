# Línea base de seguridad

- HTTPS.
- Hash seguro de contraseñas.
- Sesiones revocables.
- RBAC y autorización por objeto.
- Aislamiento multiempresa.
- Validación de entrada.
- Protección de archivos.
- Rate limiting.
- Logs sin secretos.
- Backups cifrados.
- Dependencias revisadas y SBOM.
- Redis y RabbitMQ no públicos.
- Rastreo limitado a jornada, detenido siempre al logout y con indicador visible.
- ADR-016: captura 60 s, precisión <=50 m, antigüedad <=5 min; inválidas no se
  persisten ni se usan para geocerca y solo generan telemetría sin coordenadas.
- Historial exacto de ubicación 90 días con purga física; Redis última ubicación
  <=15 min y cola local cifrada hasta confirmación o resolución autorizada.
- Reloj futuro <=2 min; una aceptada por ventana UTC de 60 s; rate-limit por
  tenant+usuario+jornada agregado multi-device, sin coordenadas en telemetría.
- `mocked=true` se rechaza; señal ausente es `UNKNOWN` y no habilita visita;
  ninguna señal produce sanción automática.
- WS reautoriza por recurso y cierra fail-closed al perder sesión/rol/equipo/
  tenant/jornada; no reconecta ni entrega snapshot con contexto revocado.
- Retención cubre backups y páginas locales mediante claves segmentadas,
  crypto-erasure, exclusión del backup SO, cuarentena pre-restore y compactación.
