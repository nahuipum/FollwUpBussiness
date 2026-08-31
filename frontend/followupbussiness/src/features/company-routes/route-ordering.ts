import type { UniqueIdentifier } from "@dnd-kit/core";
import type { CSSProperties } from "react";
import type { RoutePoint } from "./types";

export function routePointSortableId(point: RoutePoint): string | null {
  if (point.routePointId) return `route-point-${point.routePointId}`;
  if (point.customerId) return `route-customer-${point.customerId}`;
  return null;
}

export function moveDraggedRoutePoint(activeId: UniqueIdentifier, overId: UniqueIdentifier | null, itemIds: readonly string[], onMoveTo: (from: number, to: number) => void) {
  if (!overId || activeId === overId) return;
  const source = itemIds.indexOf(String(activeId)); const target = itemIds.indexOf(String(overId));
  if (source >= 0 && target >= 0) onMoveTo(source, target);
}

export function routeDragOriginStyle(isDragging: boolean, transform: string | undefined, transition: string | undefined): CSSProperties {
  return { transform, transition, visibility: isDragging ? "hidden" : undefined };
}
