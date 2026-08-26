package com.nahui.followupbussiness.routing.adapter.out.persistence;

import tools.jackson.databind.ObjectMapper;
import com.nahui.followupbussiness.routing.application.port.out.PlanningSnapshotStore;
import com.nahui.followupbussiness.routing.domain.PlanningSnapshot;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcPlanningSnapshotStore implements PlanningSnapshotStore {
 private final JdbcTemplate jdbc; private final ObjectMapper json;
 public JdbcPlanningSnapshotStore(JdbcTemplate jdbc,ObjectMapper json){this.jdbc=jdbc;this.json=json;}
 public Optional<PlanningSnapshot> findValidForUpdate(UUID tenant,UUID route,long version){return jdbc.query("select payload from route_planning_snapshot where tenant_id=? and route_id=? and base_route_version=? and status='VALID' for update",rs->{if(!rs.next())return Optional.empty();try{return Optional.of(json.readValue(rs.getString(1),PlanningSnapshot.class));}catch(Exception e){throw new IllegalStateException("invalid planning snapshot",e);}},tenant,route,version);}
 public void supersedeAndCopy(PlanningSnapshot snapshot,long version){try{jdbc.update("update route_planning_snapshot set status='SUPERSEDED',updated_at=now() where tenant_id=? and id=? and status='VALID'",snapshot.tenantId(),snapshot.id()); PlanningSnapshot copy=new PlanningSnapshot(UUID.randomUUID(),snapshot.tenantId(),snapshot.routeId(),version,snapshot.validUntil(),snapshot.shiftStart(),snapshot.shiftEnd(),snapshot.visits(),snapshot.legs()); jdbc.update("insert into route_planning_snapshot(id,tenant_id,route_id,base_route_version,status,valid_until,payload,created_at,updated_at) values(?,?,?,?, 'VALID', ?, ?::jsonb, now(), now())",copy.id(),copy.tenantId(),copy.routeId(),copy.baseRouteVersion(),Timestamp.from(copy.validUntil()),json.writeValueAsString(copy));}catch(Exception e){throw new IllegalStateException("planning snapshot persistence failed",e);}}
}
