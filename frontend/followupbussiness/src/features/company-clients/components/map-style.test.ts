import { expect, test, vi } from "vitest";
import type { Map } from "maplibre-gl";
import { handleMissingStyleImages } from "./map-style";

test("agrega marcador transparente para iconos opcionales faltantes del proveedor", () => {
  let resolveMissing: ((id: string) => void) | undefined;
  const map = {
    setMissingStyleImageResolver: vi.fn((resolver: (id: string) => void) => { resolveMissing = resolver; }),
    hasImage: vi.fn(() => false),
    addImage: vi.fn(),
  } as unknown as Map;

  handleMissingStyleImages(map);
  resolveMissing?.("swimming_pool_11");

  expect(map.addImage).toHaveBeenCalledWith("swimming_pool_11", expect.objectContaining({ width: 1, height: 1 }));
});
