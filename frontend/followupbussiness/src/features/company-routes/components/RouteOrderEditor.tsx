import { useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useRouteDirections } from "../hooks/useRouteDirections";
import type { Route } from "../types";
import { RouteSequenceMap } from "./RouteSequenceMap";
import { RouteSortableVisit } from "./RouteSortableVisit";

type Props = { route: Route; saving: boolean; onMove: (index: number, direction: -1 | 1) => void; onMoveTo: (from: number, to: number) => void; };

export function RouteOrderEditor({ route, saving, onMove, onMoveTo }: Props) {
  const [dragging, setDragging] = useState(false);
  const sortableIds = useRef(new Map<string, string>());
  const points = [...route.points].sort((a, b) => a.sequence - b.sequence);
  const itemIds = points.map((point) => {
    const key = point.routePointId ?? `sequence:${point.sequence}`;
    const current = sortableIds.current.get(key);
    if (current) return current;
    const id = `route-sort-${sortableIds.current.size + 1}`;
    sortableIds.current.set(key, id);
    return id;
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const directions = useRouteDirections(route);
  const reorder = ({ active, over }: DragEndEvent) => {
    setDragging(false);
    if (saving || !over || active.id === over.id) return;
    const source = itemIds.indexOf(String(active.id)); const target = itemIds.indexOf(String(over.id));
    if (source >= 0 && target >= 0) onMoveTo(source, target);
  };
  return <div className={`route-order-editor${dragging ? " route-order-editor--dragging" : ""}`}>
    <section className="route-order-editor__visits" aria-labelledby="route-order-visits-title">
      <h3 id="route-order-visits-title">Visitas programadas</h3>
      <p id="route-order-help" className="route-order-editor__help">Arrastra una visita por el controlador para cambiar su posición.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setDragging(true)} onDragCancel={() => setDragging(false)} onDragEnd={reorder}><SortableContext items={itemIds} strategy={verticalListSortingStrategy}><ol className="route-detail__points" aria-describedby="route-order-help">{points.map((point, index) => <RouteSortableVisit key={itemIds[index]} sortableId={itemIds[index]!} point={point} index={index} total={points.length} saving={saving} onMove={onMove} />)}</ol></SortableContext></DndContext>
    </section>
    <RouteSequenceMap points={points} {...directions} />
  </div>;
}
