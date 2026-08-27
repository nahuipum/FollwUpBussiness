import type { Route } from "./types";

/** A route name is optional in the API, but never shown to people as unnamed. */
export function routeLabel(route: Pick<Route, "name" | "date">) {
  const name = route.name?.trim();
  if (name) return name;
  const [year, month, day] = route.date.split("-");
  const date = year && month && day ? `${day}/${month}/${year}` : route.date;
  return `Ruta programada para ${date}`;
}
