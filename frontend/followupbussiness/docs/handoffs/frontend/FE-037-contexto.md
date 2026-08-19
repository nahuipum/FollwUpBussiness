# Paquete de contexto — FE-037 Gestionar zonas y territorios

**Estado actual:** remediación Development `READY_FOR_HANDOFF`; revalidación QA habilitada.
**Candidate-ID:** `HEAD 286ad04 + FE-037 territorios UI/rutas + assignedSellerCount + confirmación de inactivación`.

## Predecesoras verificadas

- `BE-062`: `docs/handoffs/dof/BE-062-dof.md` declara `PASS`; su contrato de territorios está estable.
- `FE-003`: `docs/handoffs/governance/FE-003-dof.md` declara `PASS` para limpieza de sesión y tenant.
- `FE-034`: historia entregada en el commit `b68a8d2` (`[FE-034] Manejo global de errores y permisos`), disponible como base de manejo uniforme de errores/permisos.

## Decisión contractual: uso de la zona

Producto definió `assignedSellerCount`: cantidad actual de vendedores del mismo tenant con el territorio asignado. Backend lo expone como entero de solo lectura en `Territory`/`TerritoryPage`, calculado en Workforce mediante asignaciones reales y sin revelar identidades ni inventar datos. No cuenta clientes, rutas ni referencias históricas; estas siguen intactas y la inactivación continúa siendo lógica.

## Alcance reservado tras desbloqueo

Nueva página por feature `company-territories`, con shell visual de FE-005 sin copiar sus archivos/HTML y reutilizando componentes compartidos. Roles: `COMPANY_ADMIN` administra; `SUPERVISOR` solo consulta; `SELLER` sin acceso. Se excluirán mapas/polígonos y `boundary` de toda mutación. Invariantes: aislamiento tenant; éxito real; denegación sin efectos; `409` conserva edición y no anuncia éxito; `If-Match` con `version`; limpieza total al logout/cambio de empresa.

## Contexto visual

No existe `docs/frontendMockups/FE-037.html`; al desbloquearse se consultará FE-005/patrones de `company-sellers` únicamente como referencia visual. No se modificarán mockups existentes.

## Árbol de trabajo

El árbol contiene cambios no relacionados y un `src/features/company-territories/` sin seguimiento preexistente. Se preservan; no se les atribuye estado ni evidencia de FE-037.
