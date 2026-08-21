import type { Map } from "maplibre-gl";

const transparentImage = {
  width: 1,
  height: 1,
  data: new Uint8Array([0, 0, 0, 0]),
};

/** Keeps provider styles usable when their optional POI sprite icons are unavailable. */
export function handleMissingStyleImages(map: Map) {
  map.setMissingStyleImageResolver((id) => {
    if (!map.hasImage(id)) map.addImage(id, transparentImage);
  });
}
