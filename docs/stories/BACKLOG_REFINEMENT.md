# Refinamiento integral del backlog

**Fecha de revisión:** 30 de julio de 2026
**Alcance revisado:** Backend, Frontend, Mobile, Integración y enablers
**Fuente funcional:** `00_CONTRATO_FUNCIONAL.md`

## Conclusión ejecutiva

Sí hay login en el producto:

- Web: FE-001 + BE-003, validado por INT-002.
- Mobile: MOB-001 + BE-003, validado por INT-003.

El problema era anterior al formulario: faltaba una secuencia completa para
obtener el primer usuario utilizable. La cadena corregida es:

```text
EN-010/011
  → EN-012 bootstrap del PLATFORM_SUPERADMIN
  → EN-013 estrategia de autenticación
  → BE-003 login de plataforma
  → BE-001 crear empresa
  → BE-006 activación de un solo uso
  → BE-057 provisionar COMPANY_ADMIN
  → FE-001 login de empresa
  → BE-058 gestionar usuarios de empresa
```

No existe registro público. Ningún administrador o vendedor recibe una
contraseña predeterminada; activa su cuenta mediante un mecanismo temporal de
un solo uso.

## Problemas encontrados y correcciones

| Vacío original | Efecto para el cliente/desarrollo | Corrección |
|---|---|---|
| BE-057 no estaba en el mapa de sprints | Se creaba empresa, pero nadie podía administrarla | BE-057 quedó en Sprint 1 después de empresa y activación |
| Autenticación no tenía ADR de sesión/renovación | Web, mobile y backend podían implementar esquemas incompatibles | EN-013 |
| FE-004 no tenía backend de usuarios de empresa | Pantalla sin productor real | BE-058 |
| FE-005 no tenía consulta explícita de vendedores | Tabla/selectores vacíos o acoplados al endpoint de alta | BE-059 |
| BE-012 asignaba zonas que nadie podía crear | Referencias sin catálogo | BE-062 + FE-037 |
| El contrato pedía asignar clientes, pero no había flujo | Rutas y cobertura sin cartera confiable | BE-060 + FE-036 + INT-034 |
| FE-014/MOB-004 necesitaban consultar rutas | Solo existían comandos de creación/publicación | BE-061 |
| El catálogo de productos no tenía administración web | Mobile consumía datos sin origen | FE-035 + INT-035 |
| BE-038 no tenía consumidor | Excepción de geocerca inaccesible | FE-038 + INT-036 |
| BE-043 no tenía flujo de edición | Backend sin usuario final ni prueba vertical | MOB-032 + INT-037 |
| Suspensión de empresa no tenía E2E | Riesgo de afectar otros tenants/sesiones | INT-038 |
| Comparación planificada/ejecutada no tenía E2E | FE-019 podía mostrar métricas inconsistentes | INT-039 |
| Exportación no tenía prueba vertical | Riesgo de archivos cruzados o CSV inseguro | INT-040 |
| Auditoría/configuración estaban al final | Historias tempranas exigían algo aún inexistente | BE-051 pasa a Sprint 1 y BE-054 a Sprint 3 |
| Seguridad mobile se planificaba después del almacenamiento | Tokens/datos podían persistirse antes de definir protección | EN-015 y MOB-027 pasan antes de ruta/offline |
| Detalle del vendedor dependía de visitas/ventas futuras | Pantalla inevitablemente vacía | FE-021 pasa a Sprint 8 |
| Cierre E2E se probaba antes de producir visitas pendientes | Criterios imposibles de demostrar | INT-023 pasa a Sprint 7 |

## Decisiones de producto adoptadas para aterrizar el MVP

### Identidad

- Sin registro público.
- `PLATFORM_SUPERADMIN` no pertenece a un tenant cliente.
- `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER` siempre pertenecen a una empresa.
- Alta de administrador/supervisor/vendedor usa activación de un solo uso.
- Bloquear un usuario revoca acceso y conserva historial.
- No se puede dejar una empresa activa sin al menos un administrador utilizable.

### Organización comercial

- Zona/territorio es un catálogo de empresa con código, nombre y estado.
- El MVP no requiere polígonos; estos serían alcance posterior.
- La cartera de clientes es explícita y conserva historial de reasignación.
- Reasignar cartera no reescribe visitas, ventas ni rutas históricas.

### Rutas

- Mobile siempre consulta la ruta publicada; una notificación solo avisa que
  debe actualizarla.
- Cada ruta tiene versión para detectar copias locales obsoletas.
- Duplicar y sugerir clientes son acciones del flujo web, no endpoints huérfanos.
- Tráfico en tiempo real permanece fuera del MVP salvo cambio aprobado.

### Tracking y privacidad

- Solo se captura ubicación con jornada activa e indicador visible.
- La última ubicación debe incluir hora y estado `stale`.
- Redis es estado efímero, nunca fuente de verdad.
- Retención, precisión y frecuencia se cierran en EN-016 antes del tracking.

### Visitas

- El catálogo base de resultados es versionado y funciona offline.
- Personalizar resultados por empresa queda fuera del MVP base.
- Visita fuera de ruta y excepción de geocerca son `Should Have`, deshabilitadas
  por defecto y sujetas a permiso/configuración.
- Una excepción no modifica la ubicación original, caduca y es de un solo uso.

### Ventas

- La venta simple de MOB-020 es el mínimo obligatorio.
- Catálogo y venta detallada son `Should Have / MVP condicionado`; se habilitan
  si Producto confirma el modelo detallado.
- Los totales siempre los recalcula el servidor.
- Edición dentro de ventana es condicionada; la anulación lógica auditada
  permanece en el flujo base.
- Confirmado y pendiente de sincronización se muestran por separado.

## Secuencia de valor para el cliente

| Resultado observable | Productores | Consumidores | Puerta E2E |
|---|---|---|---|
| Empresa utilizable | EN-012/013, BE-003, BE-001, BE-006, BE-057 | FE-001/002 | INT-001/002/038 |
| Equipo gestionable | BE-058/062/008/059/011/012 | FE-004/005/006/037 | INT-004/033 |
| Cartera geolocalizada | BE-013 a BE-016, BE-060 | FE-008/009/010/036 | INT-005/034 |
| Importación operativa | BE-018 a BE-020, BE-056 | FE-012/013 | INT-006 |
| Ruta entregada | BE-021 a BE-027, BE-053, BE-061 | FE-014 a FE-018, MOB-004/005/006/029 | INT-007/008/009 |
| Jornada visible | BE-028 a BE-031/033 | MOB-003/007 a 010/024/026, FE-020 | INT-010/011/026 |
| Recorrido histórico | BE-032 | FE-022 | INT-012 |
| Visita comprobable | BE-034 a BE-040 | MOB-011 a MOB-018, FE-019/023 a 025/038 | INT-013 a INT-016/023/036/039 |
| Venta sincronizada | BE-042/044/045/046 | MOB-020/022/023, FE-026/027/029 | INT-017 a INT-020 |
| Resultados reales | BE-017/047 a 050/052 | FE-011/021/028/030 a 032, MOB-031 | INT-021/022/025/040 |

## Puertas de Ready comunes

Una historia no se considera lista solo porque tenga título y criterios. Debe
tener:

1. Predecesoras resueltas o contrato estable con mock acordado.
2. Actor, tenant, permisos por recurso y alcance de equipo definidos.
3. Datos, estados, zona horaria, idempotencia y concurrencia definidos.
4. Estados de UI: carga, vacío, error, sin permiso, conflicto y degradación.
5. OpenAPI/evento/WebSocket/sync actualizado antes de implementar consumidores.
6. Casos de QA felices, negativos, límites, recuperación y regresión.
7. Revisión de Seguridad para identidad, archivos, geolocalización, offline,
   WebSocket y exportaciones.
8. Historia E2E que pruebe el resultado observable.

## Decisiones todavía abiertas, ahora visibles como enablers

No se inventaron estas decisiones porque cambian arquitectura, costo o
privacidad:

- EN-013: esquema concreto de sesión/token y revocación.
- EN-014: proveedor de mapas/geocodificación/navegación.
- EN-015: motor de base local/cifrado/sincronización.
- EN-016: frecuencia, precisión y retención de ubicaciones.
- EN-017: proveedor de correo transaccional y push.
- EN-018: motor de optimización y límites cuantitativos.

Hasta cerrar el enabler correspondiente, la HU dependiente no entra a sprint.

## Artefactos de trazabilidad

- `sprint-map.md`: secuencia y salida de cada sprint.
- `dependency-map.md`: predecesoras y consecuentes de los 182 elementos.
- `backlog.json` y `backlog.csv`: índice regenerado de las 172 historias.
- Cada archivo de historia contiene su sprint, dependencias, sucesoras,
  contrato, datos, riesgos, fuera de alcance y puerta de Ready.
