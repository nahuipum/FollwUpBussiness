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

export type TerritoryOption = Readonly<{ id: string; code: string; name: string }>;
export type ClientFormInput = Readonly<{
  name: string;
  address: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  segment: string;
  visitFrequencyDays: number | null;
  territoryId: string | null;
  latitude: number;
  longitude: number;
}>;
export type ClientFormTarget = Client & Readonly<{
  address: string;
  documentType: string | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  visitFrequencyDays: number | null;
}>;

export type ClientDuplicateCheckInput = Readonly<{
  name: string;
  documentNumber: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  excludeCustomerId: string | null;
}>;

export type ClientDuplicateCheckResult = Readonly<{
  hasPossibleDuplicates: boolean;
  candidates: readonly Client[];
}>;
