import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { routeDragOriginStyle } from "../route-ordering";
import type { RoutePoint } from "../types";

export function RouteSortableVisit({ sortableId, point, index, total, saving, onMove }: { sortableId: string; point: RoutePoint; index: number; total: number; saving: boolean; onMove: (index: number, direction: -1 | 1) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId, disabled: saving });
  const name = point.customerName ?? "Cliente no disponible";
  const role = total === 1 ? "Inicio y final" : index === 0 ? "Inicio" : index === total - 1 ? "Final" : null;
  return <li ref={setNodeRef} data-dragging={isDragging || undefined} className={`route-sortable-visit${isDragging ? " route-sortable-visit--dragging" : ""}`} style={routeDragOriginStyle(isDragging, CSS.Transform.toString(transform), transition)}>
    <strong aria-hidden="true">{point.sequence}</strong>
    <span className="route-order-editor__visit-name">{name}</span>
    {role && <span className="route-order-editor__visit-role">{role}</span>}
    <button className="route-sortable-visit__handle" type="button" aria-label={`Reordenar ${name}`} title="Arrastra para cambiar la secuencia" disabled={saving} {...attributes} {...listeners}><GripVertical aria-hidden="true" size={18} /></button>
    <div className="route-order-editor__move-actions" aria-label={`Mover ${name}`}>
      <button type="button" aria-label={`Subir ${name}`} title="Subir visita" disabled={saving || index === 0} onClick={() => onMove(index, -1)}><ArrowUp aria-hidden="true" size={16} /></button>
      <button type="button" aria-label={`Bajar ${name}`} title="Bajar visita" disabled={saving || index === total - 1} onClick={() => onMove(index, 1)}><ArrowDown aria-hidden="true" size={16} /></button>
    </div>
  </li>;
}
