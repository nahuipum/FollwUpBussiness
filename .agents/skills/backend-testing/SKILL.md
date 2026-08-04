---
name: backend-testing
description: Diseñar, implementar o revisar pruebas Backend de FollowUpBussiness con JUnit, Spring Boot, Maven y validaciones de arquitectura, contrato, persistencia y seguridad. Usar cuando una historia Java requiera estrategia de pruebas, cobertura de criterios, reproducción de un defecto o selección eficiente de tests.
---

# Probar Backend

## Seleccionar la prueba mínima suficiente

1. Mapear cada criterio de aceptación a un comportamiento observable.
2. Revisar pruebas vecinas y convenciones del módulo antes de crear archivos.
3. Elegir el nivel más pequeño que demuestre el comportamiento:
   - unitario para dominio, value objects y servicios puros;
   - aplicación para casos de uso y puertos simulados;
   - integración para SQL, migraciones, seguridad o wiring de Spring;
   - contrato para OpenAPI, eventos, WebSocket o sincronización;
   - arquitectura para límites de paquetes y módulos.
4. Evitar `@SpringBootTest` cuando una prueba aislada sea suficiente.

## Cubrir riesgos aplicables

- Camino feliz, validación, límites y errores.
- Autorización por recurso y rechazo entre tenants.
- Idempotencia, doble envío y concurrencia en comandos sensibles.
- Migración limpia y restricciones/índices cuando cambie el esquema.
- PostGIS con SRID y unidades explícitas cuando exista lógica geográfica.
- Redis, RabbitMQ y WebSocket solo si el cambio toca esas integraciones.
- No filtrar secretos, datos personales ni coordenadas innecesarias en evidencia.

Nombrar la prueba por comportamiento. Evitar aserciones sobre detalles internos
que no formen parte del contrato.

## Ejecutar eficientemente

Ejecutar primero una clase o conjunto dirigido con Maven. Ampliar a la suite del
módulo y luego a `mvn test` solo por riesgo, fallo o gate. Reutilizar CI del mismo
commit cuando sea verificable. Registrar comando, resultado y prueba asociada;
no pegar logs completos.

## Entregar

Indicar criterios cubiertos, pruebas agregadas/modificadas, comandos, resultados,
casos no ejecutados y riesgo residual. No afirmar cobertura que no tenga evidencia.
