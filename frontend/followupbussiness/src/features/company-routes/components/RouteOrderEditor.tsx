import { useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type UniqueIdentifier } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouteDirections } from "../hooks/useRouteDirections";
import type { Route } from "../types";
import { moveDraggedRoutePoint, routePointSortableId } from "../route-ordering";
import { RouteSortableVisit } from "./RouteSortableVisit";
import { RouteSequenceMap } from "./RouteSequenceMap";

type Props = { route: Route; saving: boolean; onMove: (index: number, direction: -1 | 1) => void; onMoveTo: (from: number, to: number) => void; };

export function RouteOrderEditor({ route, saving, onMove, onMoveTo }: Props) {
  const [dragging, setDragging] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const points = [...route.points].sort((a, b) => a.sequence - b.sequence);
  const tentativeItemIds = points.map(routePointSortableId);
  const canDrag = tentativeItemIds.every((id): id is string => id !== null);
  const itemIds = canDrag ? tentativeItemIds : [];
  const activePoint = activeId === null ? null : points[itemIds.indexOf(String(activeId))] ?? null;
  const directions = useRouteDirections(route);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const reorder = ({ active, over }: DragEndEvent) => {
    setDragging(false); setActiveId(null);
    if (saving) return;
    moveDraggedRoutePoint(active.id, over?.id ?? null, itemIds, onMoveTo);
  };
  return <div className={`route-order-editor${dragging ? " route-order-editor--dragging" : ""}`}>
    <RouteSequenceMap points={points} {...directions} />
    <section className="route-order-editor__visits" aria-labelledby="route-order-visits-title">
      <h3 id="route-order-visits-title">Visitas programadas</h3>
      <p id="route-order-editor-help" className="route-order-editor__help">{canDrag ? "Arrastra una visita por el controlador para cambiar su posición." : "El arrastre no está disponible para esta lista. Usa las flechas para cambiar la posición."}</p>
      {canDrag ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => { setDragging(true); setActiveId(active.id); }} onDragCancel={() => { setDragging(false); setActiveId(null); }} onDragEnd={reorder}><SortableContext items={itemIds} strategy={verticalListSortingStrategy}><ol className="route-detail__points" aria-describedby="route-order-editor-help">{points.map((point, index) => <RouteSortableVisit key={itemIds[index]} sortableId={itemIds[index]!} point={point} index={index} total={points.length} saving={saving} onMove={onMove} />)}</ol></SortableContext><DragOverlay dropAnimation={null}>{activePoint && <div className="route-sortable-visit route-sortable-visit--overlay"><strong aria-hidden="true">{activePoint.sequence}</strong><span>{activePoint.customerName ?? "Cliente no disponible"}</span></div>}</DragOverlay></DndContext> : <ol className="route-detail__points" aria-describedby="route-order-editor-help">{points.map((point, index) => { const name = point.customerName ?? "Cliente no disponible"; const role = points.length === 1 ? "Inicio y final" : index === 0 ? "Inicio" : index === points.length - 1 ? "Final" : null; return <li key={index}><strong aria-hidden="true">{point.sequence}</strong><span className="route-order-editor__visit-name">{name}</span>{role && <span className="route-order-editor__visit-role">{role}</span>}<div className="route-order-editor__move-actions" aria-label={`Mover ${name}`}><button type="button" aria-label={`Subir ${name}`} disabled={saving || index === 0} onClick={() => onMove(index, -1)}><ArrowUp aria-hidden="true" size={16} /></button><button type="button" aria-label={`Bajar ${name}`} disabled={saving || index === points.length - 1} onClick={() => onMove(index, 1)}><ArrowDown aria-hidden="true" size={16} /></button></div></li>; })}</ol>}
    </section>
  </div>;
}
