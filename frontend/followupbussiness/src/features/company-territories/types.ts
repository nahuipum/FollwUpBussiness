export type TerritoryStatus = "ACTIVE" | "INACTIVE";

export type Territory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: TerritoryStatus;
  assignedSellerCount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type TerritoryFormInput = Pick<Territory, "code" | "name" | "description" | "status">;
export type TerritoryFilters = Readonly<{ page: number; pageSize: number; search: string; status: TerritoryStatus | null }>;
export type TerritoryPage = Readonly<{ items: readonly Territory[]; page: Readonly<{ page: number; pageSize: number; totalElements: number; totalPages: number }> }>;
