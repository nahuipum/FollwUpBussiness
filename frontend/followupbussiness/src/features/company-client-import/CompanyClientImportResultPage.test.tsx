import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CompanyClientImportResultPage } from "./CompanyClientImportResultPage";

const state = vi.hoisted(() => ({ hook: vi.fn(), navigate: vi.fn() }));
vi.mock("./hooks/useCustomerImportResult", () => ({ useCustomerImportResult: state.hook }));
vi.mock("../../app/navigation", () => ({ navigate: state.navigate }));
const job = { id: "00000000-0000-4000-8000-000000000001", status: "COMPLETED_WITH_ERRORS" as const, totalRows: 3, acceptedRows: 2, rejectedRows: 1, createdAt: "2026-08-24T10:00:00Z", completedAt: "2026-08-24T10:01:00Z", errorFileExpiresAt: "2026-08-25T10:00:00Z", failureReason: null };
const base = { job, loading: false, downloading: false, downloaded: false, error: null, stale: false, expired: false, fileUnavailable: false, forbidden: false, lastUpdatedAt: "2026-08-24T10:01:00Z", polling: false, refresh: vi.fn(), downloadErrors: vi.fn() };
beforeEach(() => { state.hook.mockReset().mockReturnValue({ ...base }); state.navigate.mockReset(); }); afterEach(cleanup);

test("muestra métricas, badge y descarga lista sin exponer el UUID", () => { render(<CompanyClientImportResultPage importId={job.id} />); expect(screen.getByText("Con rechazos")).toBeTruthy(); expect(screen.getByText("Filas recibidas")).toBeTruthy(); expect(screen.getByText(/Disponible hasta/)).toBeTruthy(); expect(screen.queryByText(job.id)).toBeNull(); expect(screen.queryByText(/duplicateRows/i)).toBeNull(); });
test("representa archivo descargado, vencido y no disponible", () => { state.hook.mockReturnValue({ ...base, downloaded: true }); const { rerender } = render(<CompanyClientImportResultPage importId={job.id} />); expect(screen.getByText(/Descarga completada/)).toBeTruthy(); rerender(<CompanyClientImportResultPage importId={job.id} />); state.hook.mockReturnValue({ ...base, expired: true, fileUnavailable: true }); rerender(<CompanyClientImportResultPage importId={job.id} />); expect(screen.getByText("Archivo vencido")).toBeTruthy(); });
test("anuncia polling de forma breve y marca botón de descarga ocupado", () => { state.hook.mockReturnValue({ ...base, job: { ...job, status: "PROCESSING", rejectedRows: 0 }, polling: true }); render(<CompanyClientImportResultPage importId={job.id} />); expect(screen.getByRole("status").textContent).toContain("Actualizando"); });
test("permite volver a cargas", () => { render(<CompanyClientImportResultPage importId={job.id} />); fireEvent.click(screen.getByRole("button", { name: "Volver a cargas" })); expect(state.navigate).toHaveBeenCalledWith("/company/customer-imports"); });
