import type { Route } from "./types";

/** Formats API ISO dates for people without changing the contract value. */
export function formatRouteDate(date: string) {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

/** A route name is optional in the API, but never shown to people as unnamed. */
export function routeLabel(route: Pick<Route, "name" | "date">) {
  const name = route.name?.trim();
  if (name) return name;
  return `Ruta programada para ${formatRouteDate(route.date)}`;
}
