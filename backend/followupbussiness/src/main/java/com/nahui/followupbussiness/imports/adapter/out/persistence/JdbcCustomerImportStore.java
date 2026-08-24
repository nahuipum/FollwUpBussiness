package com.nahui.followupbussiness.imports.adapter.out.persistence;

import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import com.nahui.followupbussiness.imports.domain.CustomerImport;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCustomerImportStore implements CustomerImportStore {
    private final JdbcTemplate jdbc;

    public JdbcCustomerImportStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<CustomerImport> findByIdempotency(UUID tenant, UUID requester, String key) {
        return jdbc.query("SELECT * FROM customer_import WHERE tenant_id=? AND requested_by=? AND idempotency_key=?", this::map, tenant, requester, key).stream().findFirst();
    }

    @Override
    public Optional<CustomerImport> findById(UUID tenant, UUID id) {
        return jdbc.query("SELECT * FROM customer_import WHERE tenant_id=? AND id=?", this::map, tenant, id).stream().findFirst();
    }

    @Override
    public List<RowError> findRowErrors(UUID tenant, UUID importId) {
        return jdbc.query("SELECT e.row_number,e.error_code FROM customer_import_row_error e JOIN customer_import i ON i.id=e.import_id WHERE i.tenant_id=? AND e.import_id=? ORDER BY e.row_number,e.error_code", (r, n) -> new RowError(r.getInt("row_number"), r.getString("error_code")), tenant, importId);
    }

    @Override
    public Optional<CustomerImport> insertIfAbsent(CustomerImport j, byte[] file) {
        return jdbc.query("INSERT INTO customer_import (id,tenant_id,requested_by,correlation_id,idempotency_key,file_name,content_type,template_version,partial_acceptance,file_sha256,status,total_rows,accepted_rows,rejected_rows,original_file,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT (tenant_id,requested_by,idempotency_key) DO NOTHING RETURNING *", rs -> rs.next() ? Optional.of(map(rs, 0)) : Optional.empty(), j.id(), j.tenantId(), j.requestedBy(), j.correlationId(), j.idempotencyKey(), j.fileName(), j.contentType(), j.templateVersion(), j.partialAcceptance(), j.fileSha256(), j.status().name(), j.totalRows(), 0, 0, file, Timestamp.from(j.createdAt()), Timestamp.from(j.updatedAt()));
    }

    @Override
    public Optional<ClaimedImport> claim(UUID id, UUID tenant) {
        return jdbc.query("UPDATE customer_import SET status='PROCESSING',updated_at=now() WHERE id=? AND tenant_id=? AND status='PENDING' RETURNING *", rs -> rs.next() ? Optional.of(new ClaimedImport(map(rs, 0), rs.getBytes("original_file"))) : Optional.empty(), id, tenant);
    }

    @Override
    public void complete(UUID id, Integer total, int accepted, int rejected, boolean failed,
                         CustomerImport.FailureReason failureReason) {
        jdbc.update("UPDATE customer_import SET status=?,total_rows=?,accepted_rows=?,rejected_rows=?,failure_reason=?,terminal_at=now(),error_file_expires_at=now()+interval '30 days',updated_at=now() WHERE id=? AND status='PROCESSING'", failed ? "FAILED" : rejected == 0 ? "COMPLETED" : "COMPLETED_WITH_ERRORS", total, accepted, rejected, failureReason == null ? null : failureReason.name(), id);
    }

    @Override
    public void recordRowErrors(UUID id, List<RowError> errors) {
        for (RowError error : errors)
            jdbc.update("INSERT INTO customer_import_row_error(id,import_id,row_number,error_code,created_at) VALUES (?,?,?,?,now()) ON CONFLICT(import_id,row_number,error_code) DO NOTHING", UUID.randomUUID(), id, error.rowNumber(), error.code());
    }

    @Override
    public Optional<CustomerImport> fail(UUID id, UUID tenant) {
        return jdbc.query("UPDATE customer_import SET status='FAILED',failure_reason=NULL,terminal_at=now(),error_file_expires_at=now()+interval '30 days',updated_at=now() WHERE id=? AND tenant_id=? AND status IN ('PENDING','PROCESSING') RETURNING *", rs -> rs.next() ? Optional.of(map(rs, 0)) : Optional.empty(), id, tenant);
    }

    @Override
    public int purgeExpiredFiles() {
        return jdbc.update("UPDATE customer_import SET original_file=NULL WHERE original_file IS NOT NULL AND terminal_at < now()-interval '24 hours'");
    }

    @Override
    public int purgeExpiredRowErrors() {
        return jdbc.update("DELETE FROM customer_import_row_error WHERE import_id IN (SELECT id FROM customer_import WHERE terminal_at < now()-interval '30 days')");
    }

    private CustomerImport map(ResultSet r, int n) throws SQLException {
        String failureReason = r.getString("failure_reason");
        return new CustomerImport(r.getObject("id", UUID.class), r.getObject("tenant_id", UUID.class), r.getObject("requested_by", UUID.class), r.getObject("correlation_id", UUID.class), r.getString("idempotency_key"), r.getString("file_name"), r.getString("content_type"), r.getString("template_version"), r.getBoolean("partial_acceptance"), r.getString("file_sha256"), CustomerImport.Status.valueOf(r.getString("status")), r.getObject("total_rows", Integer.class), r.getInt("accepted_rows"), r.getInt("rejected_rows"), r.getTimestamp("created_at").toInstant(), r.getTimestamp("updated_at").toInstant(), r.getTimestamp("terminal_at") == null ? null : r.getTimestamp("terminal_at").toInstant(), r.getTimestamp("error_file_expires_at") == null ? null : r.getTimestamp("error_file_expires_at").toInstant(), failureReason == null ? null : CustomerImport.FailureReason.valueOf(failureReason));
    }
}
