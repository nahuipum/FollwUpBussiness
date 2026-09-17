type MapMarkerOptions = {
  interactive?: boolean;
  selected?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  ariaLabel?: string;
  onClick?: (event: MouseEvent) => void;
};

/** Creates the MapLibre marker DOM while keeping map-specific interactions outside the visual primitive. */
export function createMapMarker({
  interactive = false,
  selected = false,
  status,
  ariaLabel,
  onClick,
}: MapMarkerOptions = {}) {
  const className = [
    "map-marker",
    status && `map-marker--${status.toLowerCase()}`,
    selected && "map-marker--selected",
  ].filter(Boolean).join(" ");

  if (!interactive) {
    const element = document.createElement("span");
    element.className = className;
    element.setAttribute("aria-hidden", "true");
    return element;
  }

  const element = document.createElement("button");
  element.className = className;
  element.type = "button";
  element.dataset.clientMapSelection = "true";
  element.setAttribute("aria-label", ariaLabel ?? "Seleccionar cliente");
  element.setAttribute("aria-pressed", String(selected));
  element.addEventListener("focus", () => element.classList.add("map-marker--focus"));
  element.addEventListener("blur", () => element.classList.remove("map-marker--focus"));
  if (onClick) element.addEventListener("click", (event) => onClick(event));
  return element;
}
