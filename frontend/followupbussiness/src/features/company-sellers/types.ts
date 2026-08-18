export type SellerStatus = "ACTIVE" | "INACTIVE";

export type SellerReference = Readonly<{ id: string; displayName: string }>;
export type TerritoryReference = Readonly<{ id: string; code: string; name: string }>;

export type Seller = Readonly<{
  id: string; userId: string; displayName: string; email: string | null;
  phone: string | null; employeeCode: string | null; supervisorId: string | null;
  territoryIds: readonly string[]; supervisor: SellerReference | null;
  territories: readonly TerritoryReference[]; status: SellerStatus;
  createdAt: string; updatedAt: string; version: number;
}>;

export type SellerPage = Readonly<{
  items: readonly Seller[];
  page: Readonly<{ page: number; pageSize: number; totalElements: number; totalPages: number }>;
}>;

export type SellerFilters = Readonly<{
  page: number; pageSize: number; search: string; status: SellerStatus | null;
  supervisorId: string | null; territoryId: string | null;
}>;
