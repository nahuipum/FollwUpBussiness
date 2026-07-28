# BE-057 — Provisionar administrador inicial de empresa

**Área:** Backend  
**Tipo:** Historia de usuario  
**Épica:** Identidad  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** superadministrador de plataforma  
**Quiero** provisionar el administrador inicial de una empresa activa  
**Para** que la empresa pueda administrar sus usuarios y su operación

## Alcance

Crear un usuario de acceso asociado a una empresa existente y activa, asignándole únicamente el rol base `COMPANY_ADMIN` y almacenando su contraseña mediante hash seguro.

## Criterios de aceptación

1. Solo un superadministrador autorizado puede provisionar el administrador inicial.
2. El usuario queda asociado a una empresa activa y al rol `COMPANY_ADMIN`.
3. Correo o nombre de usuario se valida como único dentro de la empresa.
4. La contraseña se persiste exclusivamente mediante hash seguro y no se expone en respuestas, auditoría ni logs.
5. La operación se audita sin datos personales completos ni secretos.
6. No es posible asignar desde este flujo un rol de plataforma, un rol arbitrario ni una empresa distinta de la autorizada.

## Fuera de alcance

- Registro público o autoservicio de usuarios.
- Creación de vendedores; corresponde a BE-008.
- Login, renovación, revocación y recuperación de contraseña.
- Modificación de roles o permisos; corresponde a BE-007.
- Bootstrap operativo del primer superadministrador de plataforma; corresponde a EN-012.

## Dependencias

- EN-010 — Configurar Spring Security y gestión local de secretos.
- EN-011 — Definir catálogo de roles base.
- EN-012 — Bootstrap controlado del superadministrador de plataforma.
- BE-001 — Crear una empresa.

## Referencias

- Tipos de usuario 6.1 y 6.4
- RF-AUT-003
- RF-AUT-005
- RN-001
- RN-002
- RNF-005
- RNF-006
- RNF-008

## Seguridad y privacidad

- Derivar tenant y actor de la identidad autenticada; no aceptarlos ciegamente desde el cliente.
- Aplicar autorización por recurso sobre la empresa destino.
- No registrar secretos ni datos personales completos.

## Observabilidad

- Propagar correlationId cuando aplique.
- Registrar operación, resultado, latencia y tipo de error sin valores sensibles.

## Evidencia mínima para DoF

- Implementación, migraciones, OpenAPI y pruebas.
- Matriz criterio → evidencia.
- QA independiente, revisión de seguridad y documentación del procedimiento de bootstrap.
