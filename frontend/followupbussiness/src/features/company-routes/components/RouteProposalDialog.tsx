import { FormAlert } from "../../../shared/ui/FormAlert";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { ApiError } from "../../../lib/api";
import type { FormEvent } from "react";
import type { Route, RouteProposal, RouteProposalValidation } from "../types";
import { RouteProposalControls } from "./RouteProposalControls";

type Visit = Readonly<{
  customerId: string;
  included: boolean;
  serviceDurationMinutes: string;
  priority: string;
  windowStart: string;
  windowEnd: string;
}>;
export function RouteProposalDialog({
  route,
  availabilityStart,
  availabilityEnd,
  visits,
  proposal,
  validation,
  saving,
  error,
  conflict,
  onAvailabilityStart,
  onAvailabilityEnd,
  onVisit,
  onOptimize,
  onClose,
}: {
  route: Route;
  availabilityStart: string;
  availabilityEnd: string;
  visits: readonly Visit[];
  proposal: RouteProposal | null;
  validation: RouteProposalValidation;
  saving: boolean;
  error: ApiError | null;
  conflict: boolean;
  onAvailabilityStart: (value: string) => void;
  onAvailabilityEnd: (value: string) => void;
  onVisit: (customerId: string, patch: Partial<Visit>) => void;
  onOptimize: () => void;
  onClose: () => void;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onOptimize();
  };
  return (
    <ModalSurface
      titleId="route-proposal-title"
      onDismiss={onClose}
      className="route-detail route-detail--proposal"
    >
      <ModalHeader
        module="Rutas"
        title="Generar propuesta"
        titleId="route-proposal-title"
        onClose={onClose}
        closeDisabled={saving}
      />
      <form className="route-proposal-dialog__form" onSubmit={submit}>
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
          availabilityStart={availabilityStart}
          availabilityEnd={availabilityEnd}
          visits={visits}
          proposal={proposal}
          validation={validation}
          saving={saving}
          onAvailabilityStart={onAvailabilityStart}
          onAvailabilityEnd={onAvailabilityEnd}
          onVisit={onVisit}
        />
        <footer>
          <button
            className="route-list__secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="route-list__primary"
            type="submit"
            disabled={
              saving ||
              !availabilityStart ||
              !availabilityEnd ||
              !visits.some((visit) => visit.included)
            }
          >
            Generar propuesta
          </button>
        </footer>
      </form>
    </ModalSurface>
  );
}
