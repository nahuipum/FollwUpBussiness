import { useMemo, useState } from "react";
import type { ApiError } from "../../../lib/api";
import { Button } from "../../../shared/ui/Button";
import { TimeField } from "../../../shared/ui/TimeField";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import type { Route, RouteProposal, RouteProposalValidation } from "../types";

type Visit = Readonly<{
  customerId: string;
  included: boolean;
  serviceDurationMinutes: string;
  priority: string;
  windowStart: string;
  windowEnd: string;
}>;

type Props = {
  route: Route;
  availabilityStart: string;
  availabilityEnd: string;
  planningWindowLoading: boolean;
  planningWindowError: ApiError | null;
  visits: readonly Visit[];
  proposal: RouteProposal | null;
  validation: RouteProposalValidation;
  saving: boolean;
  showCandidateSelection?: boolean;
  onRetryPlanningWindow: () => void;
  onVisit: (customerId: string, patch: Partial<Visit>) => void;
};

const priorityOptions = [
  { value: "1", label: "Sin prioridad especial" },
  { value: "2", label: "Baja" },
  { value: "3", label: "Media" },
  { value: "4", label: "Alta" },
] as const;

const explicitPriorityOptions = [
  { value: "", label: "Selecciona una prioridad", disabled: true },
  ...priorityOptions.slice(1),
] as const;

export function RouteProposalControls({
  route,
  availabilityStart,
  availabilityEnd,
  planningWindowLoading,
  planningWindowError,
  visits,
  proposal,
  validation,
  saving,
  showCandidateSelection = false,
  onRetryPlanningWindow,
  onVisit,
}: Props) {
  const [customerToPrioritize, setCustomerToPrioritize] = useState("");
  const [priorityToAssign, setPriorityToAssign] = useState("");
  const [showDurationSetup] = useState(() => visits.some(
    (visit) => visit.included && (!/^\d+$/.test(visit.serviceDurationMinutes) || Number(visit.serviceDurationMinutes) < 1),
  ));
  const names = useMemo(() => new Map(
    route.points.map((point) => [
      point.customerId,
      point.customerName ?? "Cliente no disponible",
    ]),
  ), [route.points]);
  const selectedVisits = visits.filter((visit) => visit.included);
  const selectedCount = selectedVisits.length;
  const prioritizedVisits = selectedVisits.filter(
    (visit) => visit.priority !== "" && visit.priority !== "1",
  );
  const unprioritizedVisits = selectedVisits.filter(
    (visit) => visit.priority === "" || visit.priority === "1",
  );
  const visitsWithoutDuration = selectedVisits.filter(
    (visit) => !/^\d+$/.test(visit.serviceDurationMinutes) || Number(visit.serviceDurationMinutes) < 1,
  );
  const durationSetupVisits = showDurationSetup ? selectedVisits : visitsWithoutDuration;

  const addPriority = () => {
    if (!customerToPrioritize || !priorityToAssign) return;
    onVisit(customerToPrioritize, { priority: priorityToAssign });
    setCustomerToPrioritize("");
    setPriorityToAssign("");
  };

  return (
    <section className="route-detail__scheduled-date" aria-labelledby="route-proposal-controls-title">
      <header className="route-proposal-controls__header">
        <div>
          <h3 id="route-proposal-controls-title">Preferencias para la propuesta</h3>
          <p>Todos los clientes seleccionados participan. Añade aquí solo los que deban atenderse con prioridad especial.</p>
        </div>
        <span className="route-proposal-controls__count" role="status">
          <strong>{selectedCount}</strong>
          <span>{selectedCount === 1 ? "cliente incluido" : "clientes incluidos"}</span>
        </span>
      </header>

      {showCandidateSelection && <section className="route-proposal-candidates" aria-labelledby="route-proposal-candidates-title">
        <div><h4 id="route-proposal-candidates-title">Clientes que participarán</h4><p>El optimizador admite hasta nueve clientes por propuesta.</p></div>
        <div className="route-proposal-candidates__list">
          {visits.map((visit) => {
            const name = names.get(visit.customerId) ?? "Cliente no disponible";
            return <button key={visit.customerId} type="button" aria-pressed={visit.included} disabled={saving || (!visit.included && selectedCount >= 9)} onClick={() => onVisit(visit.customerId, { included: !visit.included })}><span aria-hidden="true">{visit.included ? "✓" : "+"}</span><strong>{name}</strong><small>{visit.included ? "Incluido" : selectedCount >= 9 ? "Límite alcanzado" : "Agregar"}</small></button>;
          })}
        </div>
      </section>}

      <section className="route-proposal-dialog__availability" aria-labelledby="route-proposal-availability-title">
        <div>
          <h4 id="route-proposal-availability-title">Jornada configurada</h4>
          <p>Este horario se administra una sola vez desde Configuración y se aplica automáticamente a la propuesta.</p>
        </div>
        {planningWindowLoading ? <p role="status">Cargando la jornada de planificación…</p> : planningWindowError || !availabilityStart || !availabilityEnd ? <div className="route-proposal-dialog__configuration-error" role="alert"><p>No hay una jornada válida disponible. Configúrala en Configuración antes de generar la propuesta.</p><Button size="compact" onClick={onRetryPlanningWindow} disabled={saving}>Reintentar</Button></div> : <dl className="route-proposal-dialog__availability-values"><div><dt>Inicio</dt><dd>{availabilityStart}</dd></div><div><dt>Fin</dt><dd>{availabilityEnd}</dd></div></dl>}
        {validation.availability && <p className="route-proposal-dialog__field-error" role="alert">{validation.availability}</p>}
      </section>

      {durationSetupVisits.length > 0 && <section className="route-proposal-duration-setup" aria-labelledby="route-proposal-duration-title">
        <div><h4 id="route-proposal-duration-title">Duración de las visitas</h4><p>Completa los minutos de atención de cada cliente. Los campos permanecerán visibles para que puedas revisar el valor completo.</p></div>
        <div className="route-proposal-duration-setup__list">
          {durationSetupVisits.map((visit) => <label key={visit.customerId}>{names.get(visit.customerId) ?? "Cliente no disponible"}<span><input aria-label={`Duración estimada de la visita de ${names.get(visit.customerId) ?? "cliente"} (minutos)`} type="number" min={1} step={1} inputMode="numeric" value={visit.serviceDurationMinutes} onChange={(event) => onVisit(visit.customerId, { serviceDurationMinutes: event.target.value })} disabled={saving} /> min</span></label>)}
        </div>
      </section>}

      {selectedCount > 0 && <section className="route-priority-builder" aria-labelledby="route-priority-builder-title">
        <div className="route-priority-builder__heading">
          <div><h4 id="route-priority-builder-title">Clientes prioritarios</h4><p>Selecciona un cliente y el nivel de prioridad que debe considerar el optimizador.</p></div>
          <span>{prioritizedVisits.length} {prioritizedVisits.length === 1 ? "priorizado" : "priorizados"}</span>
        </div>
        <div className="route-priority-builder__controls">
          <label>Cliente<VisualSelect ariaLabel="Cliente que se quiere priorizar" value={customerToPrioritize} options={[{ value: "", label: unprioritizedVisits.length === 0 ? "No hay clientes pendientes" : "Selecciona un cliente", disabled: true }, ...unprioritizedVisits.map((visit) => ({ value: visit.customerId, label: names.get(visit.customerId) ?? "Cliente no disponible" }))]} onChange={setCustomerToPrioritize} disabled={saving || unprioritizedVisits.length === 0} variant="golden" /></label>
          <label>Prioridad<VisualSelect ariaLabel="Nivel de prioridad" value={priorityToAssign} options={explicitPriorityOptions} onChange={setPriorityToAssign} disabled={saving || unprioritizedVisits.length === 0} variant="golden" /></label>
          <Button variant="primary" onClick={addPriority} disabled={saving || !customerToPrioritize || !priorityToAssign}>Agregar prioridad</Button>
        </div>

        {prioritizedVisits.length === 0 ? <div className="route-priority-builder__empty"><strong>Sin prioridades especiales</strong><p>La propuesta se generará con todos los clientes seleccionados en prioridad normal.</p></div> : <div className="route-proposal-dialog__visits">
          {prioritizedVisits.map((visit) => {
            const name = names.get(visit.customerId) ?? "Cliente no disponible";
            return <article className="route-proposal-dialog__visit" key={visit.customerId}>
              <header><div><h4>{name}</h4><p>Duración estimada: {visit.serviceDurationMinutes || "—"} min</p></div><Button size="compact" variant="ghost" onClick={() => onVisit(visit.customerId, { priority: "1", windowStart: "", windowEnd: "" })} disabled={saving}>Quitar prioridad</Button></header>
              <label>Prioridad<VisualSelect ariaLabel={`Prioridad de ${name}`} value={visit.priority} options={priorityOptions.slice(1)} onChange={(priority) => onVisit(visit.customerId, { priority })} disabled={saving} variant="golden" /></label>
              <section aria-label={`Ventana de atención de ${name}`}>
                <div className="route-proposal-dialog__field-grid">
                  <TimeField label="Inicio de ventana" value={visit.windowStart} onValueChange={(windowStart) => onVisit(visit.customerId, { windowStart })} disabled={saving} variant="golden" showClockIcon />
                  <TimeField label="Fin de ventana" value={visit.windowEnd} onValueChange={(windowEnd) => onVisit(visit.customerId, { windowEnd })} disabled={saving} variant="golden" showClockIcon />
                </div>
                {validation.windows[visit.customerId] && <p className="route-proposal-dialog__field-error" role="alert">{validation.windows[visit.customerId]}</p>}
              </section>
              <p className="route-proposal-dialog__help">La ventana horaria es opcional, pero requiere ambos extremos.</p>
            </article>;
          })}
        </div>}
      </section>}

      {proposal && <div role="status"><p>Propuesta {proposal.optimality === "OPTIMAL" ? "óptima" : proposal.optimality === "FEASIBLE" ? "factible" : "con límite de tiempo"} lista para revisar.</p>{proposal.unassignedVisits.length > 0 && <p>{proposal.unassignedVisits.length} visita(s) sin asignar según las restricciones indicadas por el servidor.</p>}</div>}
    </section>
  );
}
