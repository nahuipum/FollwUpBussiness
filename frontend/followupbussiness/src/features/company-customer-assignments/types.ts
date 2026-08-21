export type AssignmentClient = Readonly<{ id: string; name: string; territoryId: string | null; assignedSellerIds: readonly string[] }>;
export type AssignmentSeller = Readonly<{ id: string; displayName: string; status: "ACTIVE" | "INVITED" | "INACTIVE" }>;
export type AssignmentTerritory = Readonly<{ id: string; name: string; status: "ACTIVE" | "INACTIVE" }>;
export type AssignmentResult = Readonly<{ customerId: string; status: "ASSIGNED" | "REJECTED"; errorCode: string | null }>;
export type AssignmentInput = Readonly<{ customerIds: readonly string[]; sellerIds: readonly string[]; effectiveFrom: string; reason: string }>;
