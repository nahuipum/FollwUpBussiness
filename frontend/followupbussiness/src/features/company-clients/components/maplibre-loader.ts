/** Carga MapLibre y su worker una sola vez por mapa, sin exponer la clave del proveedor. */
export async function loadMapLibre() {
  const [maplibre, worker] = await Promise.all([
    import("maplibre-gl"),
    import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
  ]);
  maplibre.setWorkerUrl(worker.default);
  return maplibre;
}
