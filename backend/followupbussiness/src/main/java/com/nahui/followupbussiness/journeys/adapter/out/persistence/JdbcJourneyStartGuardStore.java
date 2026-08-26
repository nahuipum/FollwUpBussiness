package com.nahui.followupbussiness.journeys.adapter.out.persistence;

import com.nahui.followupbussiness.journeys.application.port.in.JourneyStartedStatusUseCase;
import com.nahui.followupbussiness.journeys.application.port.out.JourneyStartGuardStore;
import java.sql.Timestamp;
import java.time.Instant;
import org.springframework.jdbc.core.JdbcTemplate;

/** PostgreSQL implementation; its row lock belongs to the caller transaction. */
public final class JdbcJourneyStartGuardStore implements JourneyStartGuardStore {
    private final JdbcTemplate jdbc;

    public JdbcJourneyStartGuardStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public JourneyStartedStatusUseCase.State stateForUpdate(JourneyStartedStatusUseCase.Query query) {
        jdbc.update("insert into journey_start_guard(tenant_id,seller_id,business_date) values(?,?,?) on conflict (tenant_id,seller_id,business_date) do nothing",
                query.tenantId(), query.sellerId(), query.businessDate());
        jdbc.update("update journey_start_guard set guard_lock_txid=txid_current() where tenant_id=? and seller_id=? and business_date=?",
                query.tenantId(), query.sellerId(), query.businessDate());
        return jdbc.query("select started_at is not null from journey_start_guard where tenant_id=? and seller_id=? and business_date=? for update",
                resultSet -> {
                    if (!resultSet.next()) {
                        throw new IllegalStateException("journey start guard was not retained");
                    }
                    return resultSet.getBoolean(1) ? JourneyStartedStatusUseCase.State.STARTED : JourneyStartedStatusUseCase.State.NOT_STARTED;
                }, query.tenantId(), query.sellerId(), query.businessDate());
    }

    @Override
    public void markStarted(JourneyStartedStatusUseCase.Query query, Instant startedAt) {
        if (jdbc.update("update journey_start_guard set started_at=? where tenant_id=? and seller_id=? and business_date=? and started_at is null and guard_lock_txid=txid_current()",
                Timestamp.from(startedAt), query.tenantId(), query.sellerId(), query.businessDate()) != 1) {
            throw new IllegalStateException("journey start guard is not locked or already started");
        }
    }
}
