import { MultiSelect } from "../../../shared/ui/MultiSelect";
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
  onAvailabilityStart: (value: string) => void;
  onAvailabilityEnd: (value: string) => void;
  onVisit: (customerId: string, patch: Partial<Visit>) => void;
};

const priorityOptions = [
  { value: "NONE", label: "Selecciona prioridad", disabled: true },
  { value: "1", label: "Baja" },
  { value: "2", label: "Media" },
  { value: "3", label: "Alta" },
] as const;

export function RouteProposalControls({
  route,
  availabilityStart,
  availabilityEnd,
  visits,
  proposal,
  validation,
  saving,
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
  const selectedCustomerIds = visits
    .filter((visit) => visit.included)
    .map((visit) => visit.customerId);
  const updateSelection = (customerIds: readonly string[]) => {
    const next = new Set(customerIds);
    visits.forEach((visit) => {
      if (visit.included !== next.has(visit.customerId))
        onVisit(visit.customerId, { included: next.has(visit.customerId) });
    });
  };

  return (
    <section
      className="route-detail__scheduled-date"
      aria-labelledby="route-proposal-controls-title"
    >
      <h3 id="route-proposal-controls-title">Selecciona las visitas</h3>
      <MultiSelect
        label="Visitas candidatas"
        ariaLabel="Visitas candidatas para la propuesta"
        value={selectedCustomerIds}
        options={visits.map((visit) => ({
          value: visit.customerId,
          label: names.get(visit.customerId) ?? "Cliente no disponible",
          disabled: saving || (!visit.included && selectedCount >= 9),
        }))}
        onChange={updateSelection}
        placeholder="Selecciona visitas"
        closeOnSelect
      />
      <p role="status">
        {selectedCount} visitas seleccionadas (máximo 9 por propuesta).
      </p>
      {selectedCount > 0 && (
        <>
          <h3>Configura las visitas</h3>
          <section aria-labelledby="route-proposal-availability-title">
            <h4 id="route-proposal-availability-title">Jornada de trabajo</h4>
            <p>Indica el inicio y el fin de la jornada en que se atenderán las visitas seleccionadas.</p>
            <div className="route-proposal-dialog__field-grid">
              <TimeField
                label="Inicio de jornada"
                value={availabilityStart}
                onValueChange={onAvailabilityStart}
                disabled={saving}
                required
              />
              <TimeField
                label="Fin de jornada"
                value={availabilityEnd}
                onValueChange={onAvailabilityEnd}
                disabled={saving}
                required
              />
            </div>
            {validation.availability && <p className="route-proposal-dialog__field-error" role="alert">{validation.availability}</p>}
          </section>
          <ol className="route-proposal-dialog__visits">
            {visits
              .filter((visit) => visit.included)
              .map((visit) => (
                <li key={visit.customerId}>
                  <h4>
                    {names.get(visit.customerId) ?? "Cliente no disponible"}
                  </h4>
                  <div className="route-proposal-dialog__field-grid">
                    <label>
                      Duración estimada de la visita (minutos)
                      <input
                        className="route-proposal-dialog__duration"
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
                        value={visit.priority || "NONE"}
                        options={priorityOptions}
                        onChange={(value) =>
                          onVisit(visit.customerId, {
                            priority: value === "NONE" ? "" : value,
                          })
                        }
                        disabled={saving}
                      />
                      <span className="route-proposal-dialog__help">
                        Alta se considera antes que Media y Baja. El orden final también depende de la jornada, las ventanas y los traslados, por lo que no garantiza una posición exacta.
                      </span>
                    </label>
                  </div>
                  <section aria-labelledby={`visit-window-${visit.customerId}`}>
                    <h5 id={`visit-window-${visit.customerId}`}>
                      Ventana de atención del cliente (opcional)
                    </h5>
                    <p>
                      Úsala sólo si el cliente requiere un horario específico.
                    </p>
                    <div className="route-proposal-dialog__field-grid">
                      <TimeField
                        label="Inicio de ventana"
                        value={visit.windowStart}
                        onValueChange={(value) =>
                          onVisit(visit.customerId, { windowStart: value })
                        }
                        disabled={saving}
                      />
                      <TimeField
                        label="Fin de ventana"
                        value={visit.windowEnd}
                        onValueChange={(value) =>
                          onVisit(visit.customerId, { windowEnd: value })
                        }
                        disabled={saving}
                      />
                    </div>
                    {validation.windows[visit.customerId] && <p className="route-proposal-dialog__field-error" role="alert">{validation.windows[visit.customerId]}</p>}
                  </section>
                </li>
              ))}
          </ol>
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
