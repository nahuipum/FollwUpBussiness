# Paquete de contexto — EN-023

- Estado: `READY_FOR_HANDOFF`.
- Candidate-ID: `HEAD+284907064a21` (runtime, V48/V49, pruebas y enabler EN-023; excluye artefactos de handoff mutables).
- Alcance: guard PostgreSQL tenant/seller/fecha para
  `JourneyStartedStatusUseCase`, sin endpoint ni transición de inicio.
- Contrato: `NOT_STARTED` hasta que BE-028 escriba `started_at`; `Unavailable`
  ante fallo. BE-028 adquiere y escribe sobre el mismo guard en su transacción;
  la escritura verifica el recibo `txid_current()` del lock.
- Evidencia esperada: migración, puerto out, servicio, adaptador JDBC,
  configuración y pruebas unitarias/JDBC de aislamiento y lock.

No se abrieron fuentes primarias adicionales: el paquete BE-064 aportó la
semántica necesaria y no presentó contradicción.
