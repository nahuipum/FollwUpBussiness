package com.nahui.followupbussiness.identityaccess.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import com.nahui.followupbussiness.identityaccess.application.port.out.IdentityNotificationPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordRecoveryPort;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class CompanyUserServiceTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final PasswordRecoveryPort recovery = mock(PasswordRecoveryPort.class);
    private final IdentityNotificationPort notifications = mock(IdentityNotificationPort.class);
    private final AuditEntryStore audit = mock(AuditEntryStore.class);
    private final OutboxStore outbox = mock(OutboxStore.class);
    private final UUID tenant = UUID.randomUUID();
    private final AuthenticatedActor admin = new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.COMPANY_ADMIN);
    private final CompanyUserService service = new CompanyUserService(jdbc, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC), recovery, notifications,
            audit, outbox, "01234567890123456789012345678901".getBytes());

    @Test void insufficientActorDoesNotReachAnyMutatingPortBeforeTheTransactionalDenialAuditBoundary() {
        assertThatThrownBy(() -> service.invite(new CompanyUserService.Invite("Name", null, "a@example.test", BaseRole.SUPERVISOR),
                new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SELLER))).isInstanceOf(CompanyUserService.Forbidden.class);
        assertThatThrownBy(() -> service.status(UUID.randomUUID(), "LOCKED",
                new AuthenticatedActor(UUID.randomUUID(), null, BaseRole.PLATFORM_SUPERADMIN))).isInstanceOf(CompanyUserService.Forbidden.class);
        verifyNoInteractions(jdbc, recovery, notifications, outbox);
    }

    @Test void listUsesOnlyAuthenticatedTenant() {
        when(jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenReturn(List.of());
        when(jdbc.queryForObject(anyString(), eq(Long.class), any(Object[].class))).thenReturn(0L);
        assertThat(service.list(0, 20, null, null, null, new AuthenticatedActor(UUID.randomUUID(), tenant, BaseRole.SUPERVISOR)).items()).isEmpty();
        verify(jdbc).query(contains("company_id=?"), any(RowMapper.class), eq(tenant), eq(20), eq(0L));
        verifyNoInteractions(recovery, notifications, audit, outbox);
    }

    @Test void invitationIsInvitedAndAuditsAndOutboxesOnlyTechnicalFields() {
        UUID id = UUID.randomUUID();
        var invited = new CompanyUserService.User(id, "Private Name", "private", "private@example.test", BaseRole.SUPERVISOR,
                "INVITED", Instant.EPOCH, Instant.EPOCH, 0);
        when(jdbc.update(startsWith("INSERT INTO identity_access_account"), any(Object[].class))).thenReturn(1);
        when(jdbc.query(startsWith("SELECT id,display_name"), any(RowMapper.class), any(Object[].class))).thenReturn(List.of(invited));
        when(audit.append(any())).thenReturn(true);

        assertThat(service.invite(new CompanyUserService.Invite("Private Name", "private", "private@example.test", BaseRole.SUPERVISOR), admin).status()).isEqualTo("INVITED");

        verify(recovery).replaceToken(any()); verify(notifications).enqueue(any(UUID.class), eq(tenant), eq(PasswordRecoveryPort.Purpose.ACTIVATION), eq("private@example.test"), anyString(), any());
        var auditEntry = org.mockito.ArgumentCaptor.forClass(com.nahui.followupbussiness.audit.domain.AuditEntry.class);
        verify(audit).append(auditEntry.capture());
        assertThat(auditEntry.getValue().before()).isEmpty(); assertThat(auditEntry.getValue().after()).containsOnlyKeys("status");
        verify(outbox).append(argThat(event -> !event.payloadJson().contains("Private Name") && !event.payloadJson().contains("private@example.test")));
    }

    @Test void repeatedStatusIsWriteFreeNoOpAcrossEveryReachableSideEffectPort() {
        UUID id = UUID.randomUUID();
        var locked = new CompanyUserService.User(id, "Name", "user", "user@example.test", BaseRole.SUPERVISOR,
                "LOCKED", Instant.EPOCH, Instant.EPOCH, 2);
        when(jdbc.query(anyString(), any(RowMapper.class), eq(id), eq(tenant))).thenReturn(List.of(locked));

        assertThat(service.status(id, "LOCKED", admin)).isEqualTo(locked);

        verify(jdbc, never()).update(anyString(), any(Object[].class));
        verifyNoInteractions(recovery, notifications, audit, outbox);
    }

    @ParameterizedTest
    @ValueSource(strings = {"valid@example.test\r", "valid@example.test\n", "\rvalid@example.test", "valid@exa\nmple.test"})
    void invalidRawPatchEmailIsRejectedBeforeEveryPort(String rawEmail) {
        assertThatThrownBy(() -> service.update(UUID.randomUUID(),
                new CompanyUserService.Update(null, null, rawEmail, null, 0), admin))
                .isInstanceOf(CompanyUserService.Invalid.class);

        verifyNoInteractions(jdbc, recovery, notifications, audit, outbox);
    }
}
