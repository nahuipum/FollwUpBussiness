export type CustomerImportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "COMPLETED_WITH_ERRORS" | "FAILED";
export type CustomerImportFailureReason = "INVALID_TEMPLATE";

export type CustomerImportJob = Readonly<{
  id: string;
  status: CustomerImportStatus;
  totalRows: number | null;
  acceptedRows: number;
  rejectedRows: number;
  createdAt: string;
  completedAt: string | null;
  errorFileExpiresAt: string | null;
  failureReason: CustomerImportFailureReason | null;
}>;

export type ImportFailure = Readonly<{ status: number; correlationId: string | null }>;

export type TemplateFailure = ImportFailure & Readonly<{
  operation: "check" | "download";
}>;

export type FileValidationFailure = Readonly<{
  status: 413 | 415;
  code: "TOO_LARGE" | "INVALID_EXTENSION" | "INVALID_MIME" | "MACROS_NOT_ALLOWED";
}>;
