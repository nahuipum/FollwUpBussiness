import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { Client } from "./types";
import { CompanyClientsMapPage } from "./CompanyClientsMapPage";

const clients: readonly Client[] = [
  { id: "client-norte", name: "Comercial Norte", segment: null, territoryId: null, assignedSellerIds: [], status: "ACTIVE", location: { latitude: -12.04, longitude: -77.03 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 },
  { id: "client-sur", name: "Comercial Sur", segment: null, territoryId: null, assignedSellerIds: [], status: "ACTIVE", location: { latitude: -12.05, longitude: -77.04 }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", version: 1 },
];
let mapState: { result: { items: readonly Client[]; page: { page: number; pageSize: number; totalElements: number; totalPages: number } } | null; loading: boolean; error: { status: number; correlationId: null; fieldErrors: never[] } | null } = { result: { items: clients, page: { page: 0, pageSize: 20, totalElements: clients.length, totalPages: 1 } }, loading: false, error: null };

vi.mock("./components/ClientMap", () => ({
  ClientMap: ({ clients: mapClients }: { clients: readonly Client[] }) => <div aria-label="Marcadores del mapa">{mapClients.map((client) => <span key={client.id}>Marcador {client.name}</span>)}</div>,
}));
vi.mock("./hooks/useClients", () => ({ clientSessionKey: () => "session" }));
vi.mock("../auth/auth", () => ({
  getSessionIdentity: () => ({ roles: ["COMPANY_ADMIN"] }),
  subscribeToSession: () => () => undefined,
}));
vi.mock("./hooks/useClientMap", async () => {
  const React = await import("react");
  return {
    useClientMap: () => {
      const [search, setSearch] = React.useState("");
      const filtered = search === "Sur" ? [clients[1]] : mapState.result?.items ?? [];
      return {
        search,
        status: null,
        withoutVisitSince: "",
        withoutPurchaseSince: "",
        result: mapState.result && { ...mapState.result, items: filtered },
        loading: mapState.loading,
        error: search === "fallo" ? { status: 500, correlationId: null, fieldErrors: [] } : mapState.error,
        forbidden: false,
        lastUpdated: new Date("2026-08-20T12:47:26Z"),
        changeSearch: setSearch,
        changeStatus: () => undefined,
        changeWithoutVisitSince: () => undefined,
        changeWithoutPurchaseSince: () => undefined,
        clearFilters: () => undefined,
        retry: () => undefined,
      };
    },
  };
});

afterEach(() => { cleanup(); mapState = { result: { items: clients, page: { page: 0, pageSize: 20, totalElements: clients.length, totalPages: 1 } }, loading: false, error: null }; });

test("comparte la búsqueda autorizada entre la lista y los marcadores", () => {
  render(<CompanyClientsMapPage />);

  expect(screen.getByText("Marcador Comercial Norte")).toBeTruthy();
  expect(screen.getByText("2 clientes. Selecciona uno para ubicarlo.")).toBeTruthy();
  expect(screen.queryByPlaceholderText("Buscar en el mapa")).toBeNull();

  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar cliente por nombre o segmento" }), { target: { value: "Sur" } });

  expect(screen.queryByText("Marcador Comercial Norte")).toBeNull();
  expect(screen.getByText("Marcador Comercial Sur")).toBeTruthy();
  expect(screen.getByText("1 clientes. Selecciona uno para ubicarlo.")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Comercial Norte" })).toBeNull();
  expect(screen.getByRole("button", { name: /Comercial Sur/ })).toBeTruthy();
});

test("advierte cuando la actualización falla", () => {
  render(<CompanyClientsMapPage />);
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar cliente por nombre o segmento" }), { target: { value: "fallo" } });
  expect(screen.getByText("No pudimos actualizar los clientes. El mapa mostrado puede no estar vigente.")).toBeTruthy();
});

test("muestra la última respuesta y conserva el aviso stale durante la recarga", () => {
  mapState.loading = true;
  render(<CompanyClientsMapPage />);

  expect(screen.getByText(/Última actualización:/)).toBeTruthy();
  expect(screen.getByText(/se mantiene la última respuesta disponible/)).toBeTruthy();
  expect(screen.getByText("Marcador Comercial Norte")).toBeTruthy();
});

test("presenta un error inicial recuperable sin anunciar un mapa vacío", () => {
  mapState = { result: null, loading: false, error: { status: 500, correlationId: null, fieldErrors: [] } };
  render(<CompanyClientsMapPage />);

  expect(screen.getByText("No pudimos cargar los clientes")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
  expect(screen.queryByText("Aún no hay clientes")).toBeNull();
  expect(screen.queryByText("No encontramos clientes.")).toBeNull();
});
