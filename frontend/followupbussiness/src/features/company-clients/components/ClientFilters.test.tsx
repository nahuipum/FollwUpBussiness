import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ClientFilters } from "./ClientFilters";

test("busca por nombre o segmento y usa calendario visual accesible", () => {
  const onQueryChange = vi.fn();
  const onWithoutVisitSinceChange = vi.fn();

  render(
    <ClientFilters
      query=""
      status={null}
      territoryId={null}
      sellerId={null}
      withoutVisitSince="2026-08-19"
      withoutPurchaseSince=""
      options={{ territories: [], sellers: [] }}
      onQueryChange={onQueryChange}
      onStatusChange={() => undefined}
      onTerritoryChange={() => undefined}
      onSellerChange={() => undefined}
      onWithoutVisitSinceChange={onWithoutVisitSinceChange}
      onWithoutPurchaseSinceChange={() => undefined}
    />,
  );

  fireEvent.change(screen.getByLabelText("Buscar cliente por nombre o segmento"), {
    target: { value: "Mayorista" },
  });
  fireEvent.click(screen.getByLabelText("Sin visita desde"));
  fireEvent.click(screen.getByRole("button", { name: "20 de agosto de 2026" }));

  expect(onQueryChange).toHaveBeenCalledWith("Mayorista");
  expect(onWithoutVisitSinceChange).toHaveBeenCalledWith("2026-08-20");
  expect(screen.queryByRole("dialog", { name: "Calendario de Sin visita desde" })).toBeNull();
  expect(screen.getByLabelText("Sin compra desde").getAttribute("aria-haspopup")).toBe(
    "dialog",
  );
});
