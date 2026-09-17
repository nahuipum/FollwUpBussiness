import { useRef } from "react";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { RoutePlanningMode } from "../hooks/useRouteDraft";

export function RoutePlanningModeDialog({ onSelect, onClose }: { onSelect: (mode: RoutePlanningMode) => void; onClose: () => void }) {
  const manualModeRef = useRef<HTMLButtonElement>(null);
  return <ModalSurface titleId="route-mode-title" onDismiss={onClose} initialFocusRef={manualModeRef} className="route-mode-dialog route-mode-dialog--golden">
    <ModalHeader module="Rutas" title="Planificar ruta" titleId="route-mode-title" description="Elige cómo quieres construir el borrador. Ninguna opción publica automáticamente." onClose={onClose} />
    <div className="route-mode-grid">
      <button ref={manualModeRef} type="button" aria-pressed="true" onClick={() => onSelect("manual")}><span><ModeIcon name="route" /></span><strong>Crear manualmente</strong><p>Selecciona clientes y define el orden de visitas según tu criterio.</p><b>Crear ruta manual →</b></button>
      <button type="button" onClick={() => onSelect("automatic")}><span><ModeIcon name="activity" /></span><strong>Generar automáticamente</strong><p>Configura restricciones y recibe una propuesta que podrás revisar y modificar antes de guardarla.</p><b>Generar propuesta →</b></button>
    </div>
  </ModalSurface>;
}

function ModeIcon({ name }: { name: "route" | "activity" }) {
  return <svg aria-hidden="true" data-route-mode-icon={name} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {name === "route" ? <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h4a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4H8M8 8 6 6l2-2" /></> : <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />}
  </svg>;
}
