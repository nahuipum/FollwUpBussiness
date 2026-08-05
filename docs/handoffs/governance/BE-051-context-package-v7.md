# Paquete de Contexto de Historia — BE-051 — v7

**Sustituye v6:** corrección de reproducibilidad, sin cambio de código ni de
fuentes. El hash se verificó por el Orquestador inmediatamente antes de emitir
este paquete.

## Candidato inmutable

Base `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384`; agregado esperado
`4d23aad32d2cb2855a6060e20c83b5fc206cbd8e400d6c7b3b9f715441d416e5` de
28 rutas. Ejecutar exactamente en PowerShell desde la raíz:

```powershell
$f=@('docs\architecture\adr\ADR-016-privacidad-retencion-y-rastreo.md','docs\architecture\adr\ADR-020-retencion-auditoria-mvp.md','backend\followupbussiness\src\main\resources\db\migration\V8__create_audit_entries.sql','backend\followupbussiness\src\main\resources\db\migration\V9__secure_audit_privileges.sql')+(Get-ChildItem backend\followupbussiness\src\main\java\com\nahui\followupbussiness\audit -File -Recurse|%{$_.FullName.Substring((Get-Location).Path.Length+1)})+(Get-ChildItem backend\followupbussiness\src\test\java\com\nahui\followupbussiness\audit -File -Recurse|%{$_.FullName.Substring((Get-Location).Path.Length+1)})
$l=$f|Sort-Object|%{"$_`t$((Get-FileHash $_ -Algorithm SHA256).Hash.ToLowerInvariant())"};$b=[Text.Encoding]::UTF8.GetBytes([string]::Join("`n",$l));$h=[Security.Cryptography.SHA256]::Create().ComputeHash($b);([BitConverter]::ToString($h)-replace '-','').ToLowerInvariant()
```

No hay commit, PR ni CI. La evidencia de Dev sigue `READY_FOR_HANDOFF`; QA v4
está `BLOCKED` exclusivamente por discrepancia de reproducción y se reemplaza.

## Revisión requerida

Repetir primero el comando exacto. Si coincide, ejecutar desde limpio las 7
pruebas audit y 4 ArchUnit; validar toda la matriz v5 y especialmente SEC-004:
sin constructor/fallback único, URLs/usuarios writer-purger segregados de
Flyway/general y logins PostgreSQL reales con identidad/denegaciones. Handoffs:
Dev v2, QA v3, Security previa. Salidas: QA v5 y luego Seguridad v2; DoF solo
tras ambos `PASS`.

Las fuentes/reglas siguen: HU/contrato/API de v5, ADR-020 D1–D5, ADR-016 y
backend AGENT. Sin REST, secretos, payloads o IP pública; no releer primarias
sin excepción documentada.
