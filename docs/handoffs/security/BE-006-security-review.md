# Seguridad final — BE-006

- Estado: `PASS`
- Candidate-ID: `b562037 + a83c1c52d3fa`
- Gate: QA `PASS`; `HEAD=b562037`; firma rápida sin deriva observada tras la validación.
- Advertencia no bloqueante: el paquete conserva Candidate-ID históricos, pero el delta vigente y QA identifican inequívocamente `a83c1c52d3fa`.
- Severidad máxima abierta: ninguna. Critical/High: `0`.

## Superficie y modelo

Revisados únicamente `delivered`, `retry`, `erase`, `claimDue` y sus pruebas integradas. Activos: identificador/token cifrados, ciphertext y estado terminal de entrega. Actores: worker, gateway y cuentas tenant/plataforma. Límite de confianza: callback del worker con `id` y tenant nullable hacia PostgreSQL. Abusos decisivos: cuenta plataforma `company_id=NULL`, borrado repetido, acknowledgement/retry tardíos y reentrega posterior al crypto-erase.

## Hallazgos y evidencia

| Resultado | Severidad | Evidencia |
|---|---:|---|
| `PASS` | — | Medium cerrado: `delivered/retry/erase` usan `company_id IS NOT DISTINCT FROM ?`, por lo que la cuenta plataforma transiciona sin debilitar el aislamiento tenant. |
| `PASS` | — | Las tres operaciones exigen `delivered_at IS NULL AND superseded_at IS NULL`; `requireSingleTransition` falla explícitamente cuando la transición afecta cero o más de una fila. |
| `PASS` | — | `erase` fija `superseded_at` y vacía `payload_ciphertext`; `claimDue` excluye supersedidos, impidiendo descifrado o reentrega posterior. |
| `PASS` | — | Abuso reproducido: `platformTerminalTransitionsRejectRepeatedEraseAndLateAcknowledgementOrRetry` — PostgreSQL 17/Flyway V19, `1/1`, sin fallos; erase repetido y delivered/retry tardíos fueron rechazados y no hubo nuevo claim. |
| `PASS` | — | QA reutilizado: integración `7/7`, incluida comprobación explícita de ciphertext vacío y regresión tenant/lease. |
| `PASS` | — | Los cuatro Medium previamente cerrados —neutralidad, límite pre-JSON, latest-wins y lease/idempotencia— no pertenecen al delta terminal; no se observó cambio de esas superficies. |

## Controles y riesgos residuales

- `NOT_EXECUTED`: reinicio físico, HTTP/Redis end-to-end y gateway real; fuera del delta.
- `NOT_APPLICABLE`: ubicación, WebSocket, archivos, pagos, dependencias e infraestructura; no se justificó escaneo general.
- Riesgo residual `LOW`: no se intercalaron callbacks terminales simultáneos; los `UPDATE` condicionales atómicos y la cardinalidad exacta hacen que solo una transición pueda prosperar y las posteriores fallen cerradas.

Decisión: `PASS`; cero hallazgos abiertos y autoriza DoF. No se modificó el repositorio.
