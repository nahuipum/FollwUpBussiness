package com.nahui.followupbussiness.routing.adapter.out.persistence;

import com.nahui.followupbussiness.routing.application.port.out.RouteProposalStore;
import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase.Result;

import java.sql.Timestamp;
import java.util.*;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcRouteProposalStore implements RouteProposalStore {
    final JdbcTemplate j;

    public JdbcRouteProposalStore(JdbcTemplate x) {
        j = x;
    }

    public long nextVersion(UUID t, UUID r) {
        j.query("select pg_advisory_xact_lock(hashtext(?))", rs -> {
        }, t + ":" + r);
        Long n = j.queryForObject("select coalesce(max(proposal_version),0)+1 from route_optimization_proposal where tenant_id=? and route_id=?", Long.class, t, r);
        return n;
    }

    public void save(UUID t, UUID r, UUID a, UUID z, Result x, String i, String m) {
        j.update("insert into route_optimization_proposal(id,tenant_id,route_id,actor_id,territory_id,proposal_version,base_route_version,published,result,input_hash,matrix_hash,generated_at) values(?,?,?,?,?,?,?,false,?::jsonb,?,?,?)", UUID.randomUUID(), t, r, a, z, x.proposalVersion(), x.baseRouteVersion(), "{}", i, m, Timestamp.from(x.generatedAt()));
    }
}
