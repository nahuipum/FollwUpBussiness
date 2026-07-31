# Security Retest — EN-010

## Snapshot revisado

- Worktree independiente, detached y limpio antes y después del retest.
- Candidato:
  `14b0565b8203a3f57618b1505665d4007816aaae`.
- Base:
  `4987f5eef7c9310b5a8ed4aa2c08f96d71b6de24`.
- Diff limitado a workflow, Wrapper, POM, pruebas de política, ADR-010 y
  política SCA.
- Sin cambios API, datos, migraciones o reglas de negocio.
- Sin implementación, configuración ni dependencias de EN-018, OR-Tools o
  EN-015.
- Este informe es posvalidación y queda fuera del snapshot candidato.

## Coincidencia con QA

Seguridad verificó independientemente:

- run privado `30590039853`, intento 1, `completed/success`;
- job `91030097471` y todos sus pasos críticos en `success`;
- artifact `8778035114`, no expirado, 24,676,838 bytes;
- digest ZIP
  `3b879703d0894dfba4bcbab77c96e1a09fc4e1e90678455d7c6ff4d17c36ac77`;
- `source-files.sha256`: 503 rutas;
- `deliverables.sha256`: seis entradas verificadas byte a byte;
- 22 XML y 22 TXT Surefire: 113 pruebas, 0 fallos, 0 errores y 1 omitida;
- hash agregado Surefire:
  `795af648f8530513bc5c3704095c86ccfb882eec4377da0cacd40ca920851167`.

La única diferencia de representación es `mvnw.cmd`, explicada por
`eol=crlf`; su hash de checkout coincide con el manifest. No existe deriva de
snapshot.

## Modelo de amenazas

| Amenaza | Control | Resultado |
|---|---|---|
| Spoofing | Deny-by-default y mecanismos futuros deshabilitados | Mitigada |
| Tampering | SHA inmutables, checksum Wrapper, manifests y digest GitHub | Mitigada |
| Repudiation | Commit, run, artifact y manifests correlacionados | Mitigada |
| Information disclosure | Escaneo repo/artefacto, errores sanitizados y retención limitada | Mitigada |
| Denial of service | Fallo temprano y timeouts/gate SCA | Mitigada en alcance |
| Elevation of privilege | `anyRequest().authenticated()` y abuso 401/403 | Mitigada |
| Supply chain | Acciones fijadas, checksum y SCA | Mitigada |

## SCA y SBOM

- Trivy 0.70.0.
- JSON:
  `17e8bd795b7472c531658f0960b30d4d73bddb55931b52024bee1b7efbcde913`.
- Gate:
  `5fe0e09239310c9185ee916d65699b04a771dfc981d3a2b9fe4e00110abdf075`.
- 59 paquetes Java examinados.
- 0 vulnerabilidades totales.
- 0 Critical y 0 High.
- Sin `.trivyignore`.
- SBOM CycloneDX 1.6, 58 componentes, sin `serialNumber`.
- SBOM:
  `35df2caf1177afd5c1d5c986e2162b906fe11dc140b9ef863ab986e06d4a905b`.
- JAR:
  `afe3c1a60fc26cb488117e63a3cda3dfe1c7c50e6a29a8d295b2167e9e002e86`.
- Tomcat core/EL/WebSocket 11.0.24.
- Sin OR-Tools.

## Gestión de secretos

No se identificaron secretos activos en el repositorio ni en el artefacto:

- claves privadas: 0;
- AWS/GitHub/Slack/Google tokens: 0;
- JWT y Bearer persistidos: 0;
- URLs con credenciales: 0;
- asignaciones sensibles en Surefire: 0.

`.env.example` contiene únicamente placeholders. El secreto obligatorio no
tiene valor por defecto ni se usa como password, token o clave criptográfica.
El abuso de secreto ausente termina con código 1 antes de servir tráfico y sin
exponer el valor.

## Configuración Spring Security

- `SecurityFilterChain` explícita.
- `anyRequest().authenticated()`.
- Sin `permitAll`.
- Form login, HTTP Basic, logout y request cache deshabilitados.
- Sin usuario generado.
- 401/403 JSON sanitizados y no cacheables.
- Login, refresh, logout, actuator y rutas no mapeadas protegidos.
- 29 pruebas de `SecurityConfigurationTest`, sin fallos.

Las pruebas dinámicas de GET/POST/OPTIONS anónimos, Basic/Bearer falsos,
identidad sintética sin CSRF, secreto ausente y secreto válido produjeron los
rechazos y fallos seguros esperados.

## Dependencias adicionales

- Maven Wrapper 3.9.16.
- Checksum oficial:
  `5af3b743dd8b876b5c45da33b676251e5f1687712644abb4ee519ca56e1d89ce`.
- `mvnw` con modo Git 100755.
- Checkout, setup-java, Trivy y upload-artifact fijados por SHA.
- Dependencias internas de Trivy fijadas y binario verificado por checksum.
- Workflow con permiso único `contents: read`.
- Sin `pull_request_target` ni secretos del repositorio.
- Artifact privado con retención de 30 días.

## Hallazgos

| ID | Severidad | Activo | Condición | Evidencia | Estado |
|---|---|---|---|---|---|
| SEC-EN010-001 | Low | Secreto local | Placeholder alterado con whitespace podía evadir comparación exacta | Normalización, comparación constante y pruebas de abuso | CLOSED |
| SEC-EN010-002 | Low | Runtime HTTP | Tomcat 11.0.22 con correcciones pendientes | Árbol/JAR/SBOM 11.0.24 y Trivy 0 vulnerabilidades | CLOSED |

No se identificaron hallazgos nuevos Critical, High, Medium o Low.

## Riesgos residuales

- HTTPS productivo, autenticación real, sesiones, rate limiting, RBAC y
  aislamiento por recurso pertenecen a historias posteriores.
- La base Trivy debe mantenerse actualizada en cada ejecución.
- El artefacto expira el 2026-08-29; los hashes y referencias quedan en los
  handoffs.
- CI Linux es el candidato canónico; Windows fue reproducible dentro de su
  plataforma.
- El README backend conserva una frase histórica que debe alinearse
  editorialmente, pero los controles actuales son inequívocos.

No queda riesgo abierto incompatible con EN-010.

## Estado

PASS
