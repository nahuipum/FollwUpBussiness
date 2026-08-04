---
name: spring-hexagonal-scaffold
description: Crear o extender código Spring Boot dentro de la arquitectura hexagonal y modular de FollowUpBussiness. Usar al iniciar un caso de uso, puerto, adaptador REST/persistencia/mensajería, configuración o dominio Backend, sin generar capas o abstracciones innecesarias.
---

# Crear estructura hexagonal Spring

## Antes de crear archivos

1. Leer la historia y localizar el dominio propietario de la capacidad.
2. Inspeccionar una feature existente cercana; preferir sus nombres y patrones.
3. Confirmar contratos, persistencia y eventos realmente requeridos.
4. Detenerse y solicitar una decisión/ADR si la capacidad cambia límites de
   dominio o introduce infraestructura no aprobada.

Usar como raíz `com.nahui.followupbussiness.<dominio>` y crear únicamente las
piezas necesarias.

## Ubicar responsabilidades

- `domain`: entidades, value objects, invariantes, servicios y eventos puros.
- `application/port/in`: casos de uso expuestos.
- `application/port/out`: capacidades externas requeridas por la aplicación.
- `application`: comandos, resultados y orquestación transaccional.
- `adapter/in`: REST, CLI, WebSocket o consumidores que traducen transporte.
- `adapter/out`: persistencia, seguridad, Redis, RabbitMQ o servicios externos.
- `config`: wiring y propiedades Spring.

No colocar anotaciones Spring/JPA ni DTO de transporte en `domain`. No exponer
entidades de persistencia. No acceder a repositorios de otro dominio; usar un
puerto, contrato o evento explícito.

## Aplicar reglas transversales

- Derivar el tenant de la sesión/contexto confiable, no del cuerpo sin validar.
- Filtrar por tenant en repositorios, claves de cache, eventos y suscripciones.
- Mantener PostgreSQL como fuente de verdad.
- Añadir idempotencia, auditoría y correlation ID cuando la historia los exija.
- Crear migración Flyway para cambios de esquema sin modificar migraciones previas.
- Actualizar contratos antes del handoff si cambia una interfaz pública.

## Verificar

Agregar pruebas del dominio/caso de uso y las integraciones afectadas. Ejecutar
pruebas dirigidas más `HexagonalArchitectureTest` y `ModuleBoundaryTest` cuando
cambien paquetes. Entregar archivos, decisiones, comandos y riesgos de forma breve.
