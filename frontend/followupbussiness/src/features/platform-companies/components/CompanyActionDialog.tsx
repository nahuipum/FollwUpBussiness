import {
  Building2,
  CheckCircle2,
  LoaderCircle,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import type { ApiError } from "../../../lib/api";
import { InlineAlert } from "../../../shared/ui/error-ui/components";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { Company } from "../types";

type Action = "detail" | "suspend" | "reactivate";
type Props = {
  company: Company;
  action: Action;
  busy: boolean;
  success?: boolean;
  error: ApiError | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

export function CompanyActionDialog({
  company,
  action,
  busy,
  success = false,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const isSuspend = action === "suspend";
  const actionLabel = isSuspend ? "Suspender empresa" : "Reactivar empresa";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 5) {
      setFieldError("Describe el motivo con al menos 5 caracteres.");
      return;
    }
    setFieldError(null);
    onSubmit(reason.trim());
  };

  if (action === "detail")
    return <DetailDialog company={company} onClose={onClose} />;

  if (busy)
    return (
      <ModalSurface
        titleId="company-action-loading-title"
        onDismiss={() => undefined}
      >
        <section
          className="company-action-dialog company-action-dialog--loading"
          aria-busy="true"
        >
          <LoaderCircle
            className="company-action-dialog__spinner"
            aria-hidden="true"
          />
          <h2 id="company-action-loading-title">
            {isSuspend ? "Suspendiendo empresa" : "Reactivando empresa"}
          </h2>
          <p role="status">Procesando la solicitud. No cierres esta ventana.</p>
        </section>
      </ModalSurface>
    );

  if (success)
    return (
      <ModalSurface titleId="company-action-success-title" onDismiss={onClose}>
        <section className="company-action-dialog company-action-dialog--success">
          <CheckCircle2 aria-hidden="true" />
          <h2 id="company-action-success-title">
            {isSuspend ? "Empresa suspendida" : "Empresa reactivada"}
          </h2>
          <p>
            {isSuspend
              ? "La empresa ya no puede operar hasta su reactivación."
              : "La empresa vuelve a estar disponible para operar."}
          </p>
          <button
            type="button"
            className="company-button company-button--primary"
            onClick={onClose}
          >
            Volver a empresas
          </button>
        </section>
      </ModalSurface>
    );

  return (
    <ModalSurface
      titleId="company-action-title"
      onDismiss={busy ? () => undefined : onClose}
    >
      <form className="company-action-dialog" onSubmit={submit}>
        <ModalHeader
          module="Empresas"
          title={actionLabel}
          titleId="company-action-title"
          description={isSuspend
            ? "Confirma la suspensión de acceso para esta empresa."
            : "Confirma la reactivación de acceso para esta empresa."}
          onClose={onClose}
          closeLabel="Cerrar"
          closeDisabled={busy}
          className="company-modal__header"
        />
        <div className="company-modal__body">
          <div className="company-action-dialog__company">
            <Building2 aria-hidden="true" />
            <span>
              <strong>{company.legalName}</strong>
              <small>
                {company.code} · {company.timezone}
              </small>
            </span>
          </div>
          <label
            className="company-action-dialog__reason"
            htmlFor="company-action-reason"
          >
            Motivo
            <textarea
              id="company-action-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                isSuspend
                  ? "Ej.: solicitud de la empresa"
                  : "Ej.: servicio regularizado"
              }
              aria-invalid={fieldError !== null}
              aria-describedby={
                fieldError ? "company-action-reason-error" : undefined
              }
              minLength={5}
              maxLength={500}
              disabled={busy}
              required
            />
          </label>
          {fieldError && (
            <p
              className="company-action-dialog__error"
              id="company-action-reason-error"
              role="alert"
            >
              {fieldError}
            </p>
          )}
          {error && <StatusError error={error} />}
          <p className="company-action-dialog__notice">
            El cambio se aplicará solo tras la confirmación del servidor.
          </p>
        </div>
        <footer className="company-modal__footer">
          <button
            type="button"
            className="company-button company-button--secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`company-button ${isSuspend ? "company-button--danger" : "company-button--primary"}`}
            disabled={busy}
          >
            {isSuspend ? (
              <PauseCircle aria-hidden="true" />
            ) : (
              <PlayCircle aria-hidden="true" />
            )}
            {busy ? "Enviando…" : actionLabel}
          </button>
        </footer>
      </form>
    </ModalSurface>
  );
}

function StatusError({ error }: { error: ApiError }) {
  const message =
    error.status === 403
      ? "No tienes permisos para cambiar el estado de esta empresa."
      : error.status === 404
        ? "La empresa ya no está disponible. Actualiza el listado."
        : error.status === 409
          ? "El estado cambió antes de confirmar la acción. Actualiza el listado."
          : error.status === 401
            ? "Tu sesión ya no es válida. Inicia sesión nuevamente."
            : "No fue posible actualizar el estado. Inténtalo nuevamente.";
  return (
    <InlineAlert
      variant={error.status === 409 ? "warning" : "error"}
      title="No se aplicó el cambio"
      message={message}
      {...(error.correlationId ? { correlationId: error.correlationId } : {})}
    />
  );
}

function DetailDialog({
  company,
  onClose,
}: {
  company: Company;
  onClose: () => void;
}) {
  return (
    <ModalSurface titleId="company-detail-title" onDismiss={onClose}>
      <section className="company-action-dialog">
        <ModalHeader
          module="Empresas"
          title="Detalle de empresa"
          titleId="company-detail-title"
          description="Información disponible desde el listado de plataforma."
          onClose={onClose}
          closeLabel="Cerrar"
          className="company-modal__header"
        />
        <div className="company-modal__body">
          <dl className="company-action-dialog__details">
            <div>
              <dt>Empresa</dt>
              <dd>{company.legalName}</dd>
            </div>
            <div>
              <dt>Código</dt>
              <dd>{company.code}</dd>
            </div>
            <div>
              <dt>Zona horaria</dt>
              <dd>{company.timezone}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{company.status === "ACTIVE" ? "Activa" : "Suspendida"}</dd>
            </div>
          </dl>
        </div>
        <footer className="company-modal__footer">
          <button
            type="button"
            className="company-button company-button--primary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </footer>
      </section>
    </ModalSurface>
  );
}
