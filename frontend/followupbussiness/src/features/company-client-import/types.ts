export type CustomerImportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "COMPLETED_WITH_ERRORS" | "FAILED";

export type CustomerImportJob = Readonly<{
  id: string;
  status: CustomerImportStatus;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  createdAt: string;
  completedAt: string | null;
}>;

export type ImportFailure = Readonly<{ status: number; correlationId: string | null }>;
