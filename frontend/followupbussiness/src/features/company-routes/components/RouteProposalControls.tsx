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
  visits: readonly Visit[];
  proposal: RouteProposal | null;
  validation: RouteProposalValidation;
  saving: boolean;
  showCandidateSelection?: boolean;
  onAvailabilityStart: (value: string) => void;
  onAvailabilityEnd: (value: string) => void;
  onVisit: (customerId: string, patch: Partial<Visit>) => void;
};

const priorityOptions = [
  { value: "1", label: "Sin prioridad especial" },
  { value: "2", label: "Baja" },
  { value: "3", label: "Media" },
  { value: "4", label: "Alta" },
] as const;

const visitHelp = (index: number) => {
  if (index === 0) return "La duración es tiempo de atención, no tiempo de traslado.";
  if (index === 1) return "La ventana horaria es opcional, pero requiere ambos extremos.";
  return "La prioridad orienta el orden de la propuesta.";
};

export function RouteProposalControls({
  route,
  availabilityStart,
  availabilityEnd,
  visits,
  proposal,
  validation,
  saving,
  showCandidateSelection = false,
  onAvailabilityStart,
  onAvailabilityEnd,
  onVisit,
}: Props) {
  const names = new Map(
    route.points.map((point) => [
      point.customerId,
      point.customerName ?? "Cliente no disponible",
    ]),
  );
  const selectedCount = visits.filter((visit) => visit.included).length;
  return (
    <section
      className="route-detail__scheduled-date"
      aria-labelledby="route-proposal-controls-title"
    >
      <header className="route-proposal-controls__header">
        <div><h3 id="route-proposal-controls-title">Restricciones para la propuesta</h3><p>Las prioridades explícitas se consideran antes que las visitas sin prioridad especial. Jornada, ventanas y traslados también influyen en la propuesta; no se promete un orden por distancia.</p></div>
        <span className="route-badge route-badge--info" role="status">{selectedCount} de 9 visitas</span>
      </header>
      {showCandidateSelection && <section className="route-proposal-candidates" aria-labelledby="route-proposal-candidates-title">
        <div><h4 id="route-proposal-candidates-title">Visitas candidatas</h4><p>La selección es explícita y puede ajustarse sin cambiar el DRAFT.</p></div>
        <div className="route-proposal-candidates__list">
          {visits.map((visit) => {
            const name = names.get(visit.customerId) ?? "Cliente no disponible";
            return <button key={visit.customerId} type="button" aria-pressed={visit.included} disabled={saving || (!visit.included && selectedCount >= 9)} onClick={() => onVisit(visit.customerId, { included: !visit.included })}><span aria-hidden="true">{visit.included ? "✓" : "+"}</span><strong>{name}</strong><small>{visit.included ? "Incluida" : selectedCount >= 9 ? "Límite alcanzado" : "Agregar"}</small></button>;
          })}
        </div>
      </section>}
      {selectedCount > 0 && (
        <>
          <div className="route-proposal-dialog__visits">
          <section className="route-proposal-dialog__availability" aria-labelledby="route-proposal-availability-title">
            <h4 id="route-proposal-availability-title">Jornada de trabajo</h4>
            <p>Usa el horario operativo de la fecha seleccionada.</p>
            <div className="route-proposal-dialog__field-grid">
              <TimeField
                label="Inicio de jornada"
                value={availabilityStart}
                onValueChange={onAvailabilityStart}
                disabled={saving}
                variant="golden"
                required
              />
              <TimeField
                label="Fin de jornada"
                value={availabilityEnd}
                onValueChange={onAvailabilityEnd}
                disabled={saving}
                variant="golden"
                required
              />
            </div>
            {validation.availability && <p className="route-proposal-dialog__field-error" role="alert">{validation.availability}</p>}
          </section>
            {visits
              .filter((visit) => visit.included)
              .map((visit, index) => (
                <article className="route-proposal-dialog__visit" key={visit.customerId}>
                  <h4>
                    {names.get(visit.customerId) ?? "Cliente no disponible"}
                  </h4>
                  <div className="route-proposal-dialog__field-grid">
                    <label>
                      Duración (min)
                      <input
                        className="route-proposal-dialog__duration"
                        aria-label={`Duración estimada de la visita de ${names.get(visit.customerId) ?? "cliente"} (minutos)`}
                        required
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={visit.serviceDurationMinutes}
                        onChange={(event) =>
                          onVisit(visit.customerId, {
                            serviceDurationMinutes: event.target.value,
                          })
                        }
                        disabled={saving}
                      />
                    </label>
                    <label>
                      Prioridad
                      <VisualSelect
                        ariaLabel={`Prioridad de ${names.get(visit.customerId) ?? "cliente"}`}
                        value={visit.priority || "1"}
                        options={priorityOptions}
                        onChange={(value) =>
                          onVisit(visit.customerId, {
                            priority: value,
                          })
                        }
                        disabled={saving}
                        variant="golden"
                      />
                    </label>
                  </div>
                  <section aria-label={`Ventana de atención de ${names.get(visit.customerId) ?? "cliente"}`}>
                    <div className="route-proposal-dialog__field-grid">
                      <TimeField
                        label="Inicio de ventana"
                        value={visit.windowStart}
                        onValueChange={(value) =>
                          onVisit(visit.customerId, { windowStart: value })
                        }
                        disabled={saving}
                        variant="golden"
                        showClockIcon
                      />
                      <TimeField
                        label="Fin de ventana"
                        value={visit.windowEnd}
                        onValueChange={(value) =>
                          onVisit(visit.customerId, { windowEnd: value })
                        }
                        disabled={saving}
                        variant="golden"
                        showClockIcon
                      />
                    </div>
                    {validation.windows[visit.customerId] && <p className="route-proposal-dialog__field-error" role="alert">{validation.windows[visit.customerId]}</p>}
                  </section>
                  <p className="route-proposal-dialog__help">{visitHelp(index)}</p>
                </article>
              ))}
          </div>
        </>
      )}
      {proposal && (
        <div role="status">
          <p>
            Propuesta{" "}
            {proposal.optimality === "OPTIMAL"
              ? "óptima"
              : proposal.optimality === "FEASIBLE"
                ? "factible"
                : "con límite de tiempo"}{" "}
            lista para revisar.
          </p>
          {proposal.unassignedVisits.length > 0 && (
            <p>
              {proposal.unassignedVisits.length} visita(s) sin asignar según las
              restricciones indicadas por el servidor.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
