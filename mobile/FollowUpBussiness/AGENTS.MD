
---

# `mobile/AGENTS.md`

```markdown
# Mobile — Instrucciones locales

## Contexto obligatorio

Antes de modificar Mobile, revisar:

- `../AGENTS.md`
- `../00_CONTRATO_FUNCIONAL.md`
- `../shared/PROJECT_CONTEXT.md`
- `../shared/ENGINEERING_RULES.md`
- La historia correspondiente en `../docs/stories/`
- El contrato de sincronización en `../docs/sync/`

Roles relacionados:

- Desarrollo: `../agents/development/mobile-developer.md`
- QA: `../agents/qa/mobile-qa.md`
- Seguridad: `../agents/security/cybersecurity-reviewer.md`
- DoF: `../agents/governance/definition-of-finished.md`

## Stack

- Flutter
- Dart
- Persistencia local
- GPS
- Background location
- REST
- Sincronización offline

## Reglas obligatorias

- La aplicación es offline-first.
- Visitas y ventas no deben perderse.
- Toda operación offline utiliza un UUID.
- Los reintentos no deben generar duplicados.
- El servidor realiza la validación final de geocerca.
- La aplicación solo rastrea durante una jornada activa.
- El usuario debe saber cuándo el rastreo está funcionando.
- Al cerrar jornada debe detenerse el rastreo.
- Los tokens deben almacenarse de forma segura.
- Los datos locales deben segregarse por usuario y empresa.
- Una visita activa debe sobrevivir al reinicio de la aplicación.
- No mostrar un registro como sincronizado hasta recibir confirmación.

## Comandos

```bash
flutter pub get
flutter analyze
flutter test
flutter run