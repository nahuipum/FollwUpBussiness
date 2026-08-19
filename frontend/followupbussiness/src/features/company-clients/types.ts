export type ClientStatus = "ACTIVE" | "INACTIVE";

export type Client = Readonly<{
  id: string;
  name: string;
  segment: string | null;
  territoryId: string | null;
  assignedSellerIds: readonly string[];
  status: ClientStatus;
  location: Readonly<{ latitude: number; longitude: number }>;
  createdAt: string;
  updatedAt: string;
  version: number;
}>;

export type ClientPage = Readonly<{
  items: readonly Client[];
  page: Readonly<{ page: number; pageSize: number; totalElements: number; totalPages: number }>;
}>;

export type ClientFilters = Readonly<{
  page: number;
  pageSize: number;
  search: string;
  status: ClientStatus | null;
  territoryId: string | null;
  sellerId: string | null;
  withoutVisitSince: string;
  withoutPurchaseSince: string;
}>;

export type ClientFilterOptions = Readonly<{
  territories: readonly Readonly<{ id: string; label: string }>[];
  sellers: readonly Readonly<{ id: string; label: string }>[];
}>;
