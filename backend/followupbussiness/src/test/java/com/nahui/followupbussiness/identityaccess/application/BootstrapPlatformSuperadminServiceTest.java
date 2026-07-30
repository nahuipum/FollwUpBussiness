package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.application.port.out.BootstrapAuditPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PlatformSuperadminAccountRepository;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.identityaccess.domain.model.LoginIdentifier;
import com.nahui.followupbussiness.identityaccess.domain.model.PlatformSuperadminAccount;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

class BootstrapPlatformSuperadminServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-28T12:00:00Z");

    @Test
    void secondExecutionIsIdempotentAndNeverRotatesTheHash() {
        InMemoryRepository repository = new InMemoryRepository();
        RecordingAudit audit = new RecordingAudit();
        AtomicInteger hashCalls = new AtomicInteger();
        BootstrapPlatformSuperadminService service = service(
                repository,
                audit,
                password -> {
                    hashCalls.incrementAndGet();
                    return "$2a$12$" + "A".repeat(53);
                });
        LoginIdentifier identity =
                new LoginIdentifier("operator-" + UUID.randomUUID() + "@invalid.example");

        BootstrapPlatformSuperadminResult first = execute(service, identity);
        String firstHash = repository.inserted.passwordHash();
        BootstrapPlatformSuperadminResult retry = execute(service, identity);

        assertThat(first.status()).isEqualTo(BootstrapPlatformSuperadminResult.Status.CREATED);
        assertThat(retry.status())
                .isEqualTo(BootstrapPlatformSuperadminResult.Status.ALREADY_PROVISIONED);
        assertThat(retry.accountId()).isEqualTo(first.accountId());
        assertThat(repository.inserted.passwordHash()).isEqualTo(firstHash);
        assertThat(hashCalls).hasValue(1);
        assertThat(audit.statuses).containsExactly(
                BootstrapPlatformSuperadminResult.Status.CREATED,
                BootstrapPlatformSuperadminResult.Status.ALREADY_PROVISIONED);
    }

    @Test
    void differentIdentityCannotCreateAnotherPrivilegedAccount() {
        InMemoryRepository repository = new InMemoryRepository();
        RecordingAudit audit = new RecordingAudit();
        BootstrapPlatformSuperadminService service =
                service(repository, audit, password -> "$2a$12$" + "B".repeat(53));

        BootstrapPlatformSuperadminResult created = execute(
                service,
                new LoginIdentifier("operator-" + UUID.randomUUID() + "@invalid.example"));
        BootstrapPlatformSuperadminResult conflict = execute(
                service,
                new LoginIdentifier("other-" + UUID.randomUUID() + "@invalid.example"));

        assertThat(created.status()).isEqualTo(BootstrapPlatformSuperadminResult.Status.CREATED);
        assertThat(conflict.status()).isEqualTo(BootstrapPlatformSuperadminResult.Status.CONFLICT);
        assertThat(repository.insertAttempts).isEqualTo(1);
        assertThat(repository.inserted.role()).isEqualTo(BaseRole.PLATFORM_SUPERADMIN);
        assertThat(repository.inserted.companyId()).isNull();
    }

    @Test
    void existingCompanyIdentityIsRejectedWithoutHashingOrPrivilegeElevation() {
        InMemoryRepository repository = new InMemoryRepository();
        LoginIdentifier identity =
                new LoginIdentifier("operator-" + UUID.randomUUID() + "@invalid.example");
        UUID existingId = UUID.randomUUID();
        repository.forcedIdentity = new PlatformSuperadminAccountRepository.ExistingAccount(
                existingId,
                BaseRole.COMPANY_ADMIN,
                UUID.randomUUID());
        RecordingAudit audit = new RecordingAudit();
        AtomicInteger hashCalls = new AtomicInteger();
        BootstrapPlatformSuperadminService service = service(
                repository,
                audit,
                password -> {
                    hashCalls.incrementAndGet();
                    return "$2a$12$" + "C".repeat(53);
                });

        BootstrapPlatformSuperadminResult result = execute(service, identity);

        assertThat(result.status()).isEqualTo(BootstrapPlatformSuperadminResult.Status.CONFLICT);
        assertThat(result.accountId()).isEqualTo(existingId);
        assertThat(hashCalls).hasValue(0);
        assertThat(repository.inserted).isNull();
    }

    private static BootstrapPlatformSuperadminService service(
            InMemoryRepository repository,
            RecordingAudit audit,
            com.nahui.followupbussiness.identityaccess.application.port.out.PasswordHashingPort hasher) {
        AtomicLong sequence = new AtomicLong();
        return new BootstrapPlatformSuperadminService(
                repository,
                hasher,
                audit,
                Clock.fixed(NOW, ZoneOffset.UTC),
                () -> new UUID(0L, sequence.incrementAndGet()));
    }

    private static BootstrapPlatformSuperadminResult execute(
            BootstrapPlatformSuperadminService service,
            LoginIdentifier identity) {
        char[] password = (UUID.randomUUID() + "!" + UUID.randomUUID()).toCharArray();
        try (BootstrapPlatformSuperadminCommand command =
                new BootstrapPlatformSuperadminCommand(identity, password, UUID.randomUUID())) {
            return service.execute(command);
        }
    }

    private static final class InMemoryRepository
            implements PlatformSuperadminAccountRepository {

        private PlatformSuperadminAccount inserted;
        private ExistingAccount forcedIdentity;
        private int insertAttempts;

        @Override
        public Optional<ExistingAccount> findAnyByLoginIdentifier(LoginIdentifier loginIdentifier) {
            if (forcedIdentity != null) {
                return Optional.of(forcedIdentity);
            }
            if (inserted != null && inserted.loginIdentifier().equals(loginIdentifier)) {
                return Optional.of(new ExistingAccount(
                        inserted.id(),
                        inserted.role(),
                        inserted.companyId()));
            }
            return Optional.empty();
        }

        @Override
        public Optional<ExistingAccount> findPlatformSuperadmin() {
            if (inserted == null) {
                return Optional.empty();
            }
            return Optional.of(new ExistingAccount(
                    inserted.id(),
                    inserted.role(),
                    inserted.companyId()));
        }

        @Override
        public boolean insertIfAbsent(PlatformSuperadminAccount account) {
            insertAttempts++;
            if (inserted != null) {
                return false;
            }
            inserted = account;
            return true;
        }
    }

    private static final class RecordingAudit implements BootstrapAuditPort {

        private final List<BootstrapPlatformSuperadminResult.Status> statuses = new ArrayList<>();

        @Override
        public void record(
                UUID auditId,
                BootstrapPlatformSuperadminResult.Status result,
                UUID correlationId,
                UUID accountId,
                Instant occurredAt) {
            statuses.add(result);
        }
    }
}
