export type CompanyUserRole = "COMPANY_ADMIN" | "SUPERVISOR";
export type CompanyUserStatus = "INVITED" | "ACTIVE" | "INACTIVE" | "LOCKED";

export type CompanyUser = Readonly<{
  id: string;
  displayName: string;
  email: string;
  username: string | null;
  role: CompanyUserRole;
  status: CompanyUserStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}>;

export type CompanyUserPage = Readonly<{
  items: readonly CompanyUser[];
  page: Readonly<{
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  }>;
}>;

export type CompanyUserInput = Readonly<{
  displayName: string;
  email: string;
  role: CompanyUserRole;
  username?: string;
}>;
