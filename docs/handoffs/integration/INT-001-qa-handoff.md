# INT-001 — Handoff QA de integración

- **Estado:** `PASS`
- **Candidate-ID:** `e01c35c+0061cef1e255`
- **Alcance:** remediación de `INT001-QA-01` para `GET /platform/companies/{companyId}`.

## Resultado de revalidación

Contra el backend reiniciado, con la cuenta bootstrap autorizada y sin exponer credenciales: login de `PLATFORM_SUPERADMIN` (`200`), alta de empresa INT-001 con sufijo temporal (`201`), detalle por el ID retornado (`200`), listado con una coincidencia (`200`), detalle inexistente (`404`), acceso anónimo al detalle (`401`) y cierre de sesión (`204`). No se alteraron datos existentes ni se registraron secretos.

`INT001-QA-01` queda cerrado: la cadena HTTP autenticada `201 → 200` se reprodujo en la instancia activa. El árbol contiene la corrección para la ruta y pruebas relacionadas, con digest `0061cef1e255…`; `git diff --check` PASS. Seguridad es aplicable y puede iniciar; DoF queda pendiente de su resultado.
