package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.application.port.in.BootstrapPlatformSuperadminUseCase;
import com.nahui.followupbussiness.identityaccess.application.port.out.BootstrapAuditPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PasswordHashingPort;
import com.nahui.followupbussiness.identityaccess.application.port.out.PlatformSuperadminAccountRepository;
import com.nahui.followupbussiness.identityaccess.application.port.out.PlatformSuperadminAccountRepository.ExistingAccount;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.identityaccess.domain.model.PlatformSuperadminAccount;

import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

public final class BootstrapPlatformSuperadminService implements BootstrapPlatformSuperadminUseCase {

    private final PlatformSuperadminAccountRepository accountRepository;
    private final PasswordHashingPort passwordHashingPort;
    private final BootstrapAuditPort auditPort;
    private final Clock clock;
    private final Supplier<UUID> idGenerator;

    public BootstrapPlatformSuperadminService(
            PlatformSuperadminAccountRepository accountRepository,
            PasswordHashingPort passwordHashingPort,
            BootstrapAuditPort auditPort,
            Clock clock,
            Supplier<UUID> idGenerator) {
        this.accountRepository = accountRepository;
        this.passwordHashingPort = passwordHashingPort;
        this.auditPort = auditPort;
        this.clock = clock;
        this.idGenerator = idGenerator;
    }

    @Override
    public BootstrapPlatformSuperadminResult execute(BootstrapPlatformSuperadminCommand command) {
        Optional<ExistingAccount> sameIdentity =
                accountRepository.findAnyByLoginIdentifier(command.loginIdentifier());
        if (sameIdentity.isPresent()) {
            return existingIdentityResult(command, sameIdentity.orElseThrow());
        }

        Optional<ExistingAccount> currentPlatformSuperadmin =
                accountRepository.findPlatformSuperadmin();
        if (currentPlatformSuperadmin.isPresent()) {
            return auditedResult(
                    BootstrapPlatformSuperadminResult.Status.CONFLICT,
                    currentPlatformSuperadmin.orElseThrow().id(),
                    command.correlationId());
        }

        char[] password = command.passwordCopy();
        String passwordHash;
        try {
            passwordHash = passwordHashingPort.hash(password);
        } finally {
            Arrays.fill(password, '\0');
        }

        Instant now = clock.instant();
        PlatformSuperadminAccount candidate = PlatformSuperadminAccount.create(
                idGenerator.get(),
                command.loginIdentifier(),
                passwordHash,
                now);
        if (accountRepository.insertIfAbsent(candidate)) {
            completeProfile(candidate.id(), command);
            return auditedResult(
                    BootstrapPlatformSuperadminResult.Status.CREATED,
                    candidate.id(),
                    command.correlationId());
        }

        Optional<ExistingAccount> concurrentIdentity =
                accountRepository.findAnyByLoginIdentifier(command.loginIdentifier());
        if (concurrentIdentity.isPresent()) {
            return existingIdentityResult(command, concurrentIdentity.orElseThrow());
        }
        return auditedResult(
                BootstrapPlatformSuperadminResult.Status.CONFLICT,
                accountRepository.findPlatformSuperadmin()
                        .map(ExistingAccount::id)
                        .orElse(null),
                command.correlationId());
    }

    private BootstrapPlatformSuperadminResult existingIdentityResult(
            BootstrapPlatformSuperadminCommand command,
            ExistingAccount account) {
        boolean isSamePlatformAccount = account.role() == BaseRole.PLATFORM_SUPERADMIN
                && account.companyId() == null;
        if (isSamePlatformAccount) {
            completeProfile(account.id(), command);
        }
        return auditedResult(
                isSamePlatformAccount
                        ? BootstrapPlatformSuperadminResult.Status.ALREADY_PROVISIONED
                        : BootstrapPlatformSuperadminResult.Status.CONFLICT,
                account.id(),
                command.correlationId());
    }

    private void completeProfile(UUID accountId, BootstrapPlatformSuperadminCommand command) {
        // A retry may fill only an account created by an earlier controlled bootstrap.
        // Existing profile data is immutable here and is never read or logged.
        accountRepository.completeProfileIfMissing(accountId, command.displayName(), command.email());
    }

    private BootstrapPlatformSuperadminResult auditedResult(
            BootstrapPlatformSuperadminResult.Status status,
            UUID accountId,
            UUID correlationId) {
        auditPort.record(idGenerator.get(), status, correlationId, accountId, clock.instant());
        return new BootstrapPlatformSuperadminResult(status, accountId, correlationId);
    }
}
