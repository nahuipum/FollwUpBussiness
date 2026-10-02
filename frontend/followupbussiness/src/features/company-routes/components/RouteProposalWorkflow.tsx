import { ArrowRight, Info } from "lucide-react";
import { FormAlert } from "../../../shared/ui/FormAlert";
import { WorkflowStepper } from "../../../shared/ui/WorkflowStepper";
import type { ApiError } from "../../../lib/api";
import type { FormEvent } from "react";
import type { Route, RouteProposal, RouteProposalValidation } from "../types";
import { RouteProposalControls } from "./RouteProposalControls";
import { Button } from "../../../shared/ui/Button";

type Visit = Readonly<{
  customerId: string;
  included: boolean;
  serviceDurationMinutes: string;
  priority: string;
  windowStart: string;
  windowEnd: string;
}>;
export function RouteProposalWorkflow({
  route,
  availabilityStart,
  availabilityEnd,
  planningWindowLoading,
  planningWindowError,
  visits,
  proposal,
  validation,
  saving,
  error,
  conflict,
  onRetryPlanningWindow,
  onVisit,
  onOptimize,
  onClose,
  onChangeMode,
}: {
  route: Route;
  availabilityStart: string;
  availabilityEnd: string;
  planningWindowLoading: boolean;
  planningWindowError: ApiError | null;
  visits: readonly Visit[];
  proposal: RouteProposal | null;
  validation: RouteProposalValidation;
  saving: boolean;
  error: ApiError | null;
  conflict: boolean;
  onRetryPlanningWindow: () => void;
  onVisit: (customerId: string, patch: Partial<Visit>) => void;
  onOptimize: () => void;
  onClose: () => void;
  onChangeMode: () => void;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onOptimize();
  };
  return (
    <section className="route-page-workflow" aria-labelledby="route-proposal-title">
      <header className="routes-page__heading route-workflow-heading"><div><span className="route-eyebrow">Planificación operativa</span><h1 id="route-proposal-title">Generar propuesta automática</h1><p>Configura un borrador base y recibe una propuesta editable. Generar no guarda el orden ni publica la ruta.</p></div><Button onClick={onChangeMode} disabled={saving} leadingIcon={<ArrowRight aria-hidden="true" />}>Ordenar manualmente</Button></header>
      <div className="route-workflow-card route-detail--proposal">
      <WorkflowStepper label="Progreso de propuesta automática" steps={[{ label: "Datos base", state: "complete" }, { label: "Clientes", state: "complete" }, { label: "Restricciones", state: "current" }, { label: "Generar propuesta" }, { label: "Revisar y guardar" }]} />
      <form className="route-proposal-dialog__form" onSubmit={submit}>
        <div className="route-info"><Info aria-hidden="true" /><div><strong>Generar no guarda ni publica</strong><p>El borrador técnico se prepara internamente al generar. Conservamos fecha, vendedor, clientes y restricciones si alguna operación falla.</p></div></div>
        {conflict && (
          <FormAlert>
            <strong>El borrador cambió</strong>
            <p>
              Actualiza el detalle y genera una propuesta nueva antes de
              guardar.
            </p>
          </FormAlert>
        )}
        {error && (
          <FormAlert>
            <strong>
              {error.status === 422
                ? "La ruta requiere configuración"
                : error.status === 403
                  ? "No tienes permiso para generar esta propuesta"
                  : error.status === 503
                    ? "El servicio de optimización no está disponible"
                    : "No pudimos procesar la propuesta"}
            </strong>
            <p>
              {error.code === "MULTIPLE_VISIT_TERRITORIES_NOT_SUPPORTED"
                ? "Selecciona visitas de un solo territorio y vuelve a intentarlo."
                : error.code === "VISIT_TERRITORY_NOT_ASSIGNED_TO_SELLER"
                ? "Las visitas deben pertenecer a un territorio asignado al vendedor de la ruta."
                : error.code === "VISIT_TERRITORY_REQUIRED"
                ? "La visita seleccionada no tiene territorio asignado. Asígnale un territorio y vuelve a intentarlo."
                : error.code === "ROUTE_ENDPOINT_LOCATION_REQUIRED"
                ? "La ruta necesita ubicación en su primer y último cliente para generar la propuesta."
                : error.status === 422
                ? "Revisa la configuración de las visitas y vuelve a intentarlo."
                : "Inténtalo nuevamente."}
            </p>
            {error.correlationId && (
              <p>
                Identificador de seguimiento: <code>{error.correlationId}</code>
              </p>
            )}
          </FormAlert>
        )}
        <RouteProposalControls
          route={route}
          showCandidateSelection={route.points.length > 9}
          availabilityStart={availabilityStart}
          availabilityEnd={availabilityEnd}
          planningWindowLoading={planningWindowLoading}
          planningWindowError={planningWindowError}
          visits={visits}
          proposal={proposal}
          validation={validation}
          saving={saving}
          onRetryPlanningWindow={onRetryPlanningWindow}
          onVisit={onVisit}
        />
        <footer>
          <Button
            onClick={onClose}
            disabled={saving}
          >
            Guardar y salir
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={
              saving ||
              planningWindowLoading ||
              Boolean(planningWindowError) ||
              !availabilityStart ||
              !availabilityEnd ||
              !visits.some((visit) => visit.included)
            }
          >
            Generar propuesta
          </Button>
        </footer>
      </form></div>
    </section>
  );
}
