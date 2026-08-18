package com.nahui.followupbussiness.workforce.application.port.out;

import com.nahui.followupbussiness.workforce.domain.Seller;
import com.nahui.followupbussiness.workforce.domain.TerritoryStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Set;

public interface SellerStore {
    boolean activeSupervisor(UUID tenantId, UUID accountId);

    boolean activeTerritory(UUID tenantId, UUID territoryId);

    default boolean territoryBelongsToTenant(UUID tenantId, UUID territoryId) {
        return false;
    }

    Seller insert(Seller seller);

    default boolean existsEmployeeCode(UUID tenantId, String employeeCode, UUID excludingSellerId) {
        return false;
    }

    default void lockEmployeeCode(UUID tenantId, String employeeCode) {
    }

    default Optional<Seller> update(Seller seller, long expectedVersion) {
        return Optional.empty();
    }

    default Optional<Seller> updateStatus(Seller seller, TerritoryStatus expectedStatus) {
        return Optional.empty();
    }

    default Optional<Seller> updateSupervisor(Seller seller, UUID expectedSupervisorId, long expectedVersion) {
        return Optional.empty();
    }

    default Optional<Seller> replaceTerritories(Seller seller, long expectedVersion) {
        return Optional.empty();
    }

    Optional<Seller> find(UUID tenantId, UUID sellerId);

    List<Seller> list(UUID tenantId, UUID supervisorId, com.nahui.followupbussiness.workforce.domain.TerritoryStatus status,
                      UUID requestedSupervisorId, UUID territoryId, String search, int offset, int limit);

    long count(UUID tenantId, UUID supervisorId, com.nahui.followupbussiness.workforce.domain.TerritoryStatus status,
               UUID requestedSupervisorId, UUID territoryId, String search);

    default Set<UUID> activeSellerIdsForUser(UUID tenantId, UUID userId) {
        return Set.of();
    }

    default Set<UUID> activeSellerIdsForSupervisor(UUID tenantId, UUID supervisorId) {
        return Set.of();
    }
}
