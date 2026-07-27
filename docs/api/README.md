# Contratos API

`openapi.yaml` es la fuente compartida entre Backend, Frontend, Mobile y QA.

- Los cambios incompatibles requieren versión o transición.
- Frontend y Mobile derivan tipos del contrato.
- Las colecciones grandes se paginan.
- Operaciones móviles sensibles son idempotentes.
- El tenant no se recibe como autoridad desde el cliente.
