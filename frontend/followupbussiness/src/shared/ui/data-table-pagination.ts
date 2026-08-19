export const dataTablePageSizes = [5, 10, 15, 20] as const;

export type DataTablePageSize = (typeof dataTablePageSizes)[number];
