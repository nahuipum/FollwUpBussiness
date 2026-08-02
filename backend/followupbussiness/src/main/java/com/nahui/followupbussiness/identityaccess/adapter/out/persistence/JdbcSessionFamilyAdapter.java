package com.nahui.followupbussiness.identityaccess.adapter.out.persistence;
import com.nahui.followupbussiness.identityaccess.application.port.out.SessionFamilyPort;
import org.springframework.jdbc.core.JdbcTemplate;
import java.sql.Timestamp; import java.time.Instant; import java.util.UUID;
public final class JdbcSessionFamilyAdapter implements SessionFamilyPort { private final JdbcTemplate jdbc; public JdbcSessionFamilyAdapter(JdbcTemplate jdbc){this.jdbc=jdbc;} public void create(UUID id,UUID accountId,UUID companyId,String channel,byte[] client,byte[] refresh,byte[] csrf,byte[] ticket,Instant expires,Instant created){jdbc.update("INSERT INTO identity_access_session_family(id,account_id,company_id,channel,client_instance_digest,refresh_token_digest,csrf_token_digest,revocation_ticket_digest,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",id,accountId,companyId,channel,client,refresh,csrf,ticket,Timestamp.from(expires),Timestamp.from(created));} }
