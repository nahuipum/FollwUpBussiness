package com.nahui.followupbussiness.workforce.application.port.out;

import com.nahui.followupbussiness.workforce.domain.Seller;
import com.nahui.followupbussiness.workforce.domain.SellerStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Set;
import java.util.Map;

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

    default Optional<Seller> updateStatus(Seller seller, SellerStatus expectedStatus) {
        return Optional.empty();
    }

    default Optional<Seller> updateSupervisor(Seller seller, UUID expectedSupervisorId, long expectedVersion) {
        return Optional.empty();
    }

    default Optional<Seller> replaceTerritories(Seller seller, long expectedVersion) {
        return Optional.empty();
    }

    Optional<Seller> find(UUID tenantId, UUID sellerId);

    List<Seller> list(UUID tenantId, UUID supervisorId, SellerStatus status,
                      UUID requestedSupervisorId, UUID territoryId, String search, int offset, int limit);

    long count(UUID tenantId, UUID supervisorId, SellerStatus status,
               UUID requestedSupervisorId, UUID territoryId, String search);

    /** Batch-only display references for a page of sellers already scoped to the tenant. */
    default Map<UUID, SellerReferences> references(UUID tenantId, List<Seller> sellers) {
        return Map.of();
    }

    default Set<UUID> activeSellerIdsForUser(UUID tenantId, UUID userId) {
        return Set.of();
    }

    default Set<UUID> activeSellerIdsForSupervisor(UUID tenantId, UUID supervisorId) {
        return Set.of();
    }
    default Set<UUID> activeSellerIdsForTenant(UUID tenantId) { return Set.of(); }

    record SellerReferences(Supervisor supervisor, List<Territory> territories) {
        public SellerReferences {
            territories = List.copyOf(territories == null ? List.of() : territories);
        }
    }

    record Supervisor(UUID id, String displayName) { }

    record Territory(UUID id, String code, String name) { }
}
