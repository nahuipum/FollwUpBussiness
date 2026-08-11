export type CompanyStatus = "ACTIVE" | "SUSPENDED";

export type Company = Readonly<{
  id: string;
  legalName: string;
  tradeName: string | null;
  code: string;
  timezone: string;
  status: CompanyStatus;
}>;

export type CompanyPage = Readonly<{
  items: readonly Company[];
  page: Readonly<{
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  }>;
}>;

export type CreateCompanyInput = Readonly<{
  legalName: string;
  tradeName?: string;
  taxId?: string;
  timezone: string;
  currency: string;
}>;

export type CompanyCurrency = Readonly<{ code: string; displayName: string }>;

export type ProvisionInitialAdminInput = Readonly<{
  displayName: string;
  email: string;
  username?: string;
}>;

export type AdminInvitationDeliveryStatus =
  | "PENDING"
  | "SENT"
  | "FAILED"
  | "ACCEPTED";

export type CompanyAdminInvitation = Readonly<{
  id: string;
  displayName: string;
  email: string;
  accountStatus: string;
  deliveryStatus: AdminInvitationDeliveryStatus;
  createdAt: string;
  deliveredAt: string | null;
  deliveryAttempts: number;
}>;
