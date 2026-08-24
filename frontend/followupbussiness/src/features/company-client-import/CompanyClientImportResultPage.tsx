import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { navigate } from "../../app/navigation";
import { useCustomerImportResult } from "./hooks/useCustomerImportResult";
import "./styles/company-client-import.css";
import "./styles/company-client-import-result.css";

const messages: Record<number, string> = {
  400: "No pudimos procesar la consulta. Inténtalo nuevamente.",
  410: "El archivo de errores ya venció y no puede descargarse.",
  500: "No pudimos actualizar el resultado. Inténtalo nuevamente.",
};

const statusCopy = {
  PENDING: {
    title: "Importación pendiente",
    description: "Recibimos el archivo y estamos preparando su procesamiento.",
  },
  PROCESSING: {
    title: "Procesando importación",
    description: "Estamos validando las filas del archivo.",
  },
  COMPLETED: {
    title: "Importación completada",
    description: "El procesamiento terminó correctamente.",
  },
  COMPLETED_WITH_ERRORS: {
    title: "Importación completada con rechazos",
    description:
      "Puedes revisar las filas rechazadas en el archivo de errores.",
  },
  FAILED: {
    title: "No pudimos procesar el archivo",
    description:
      "Antes de intentarlo nuevamente, revisa que el archivo provenga de una plantilla vigente y conserve sin cambios la fila de versión y las cabeceras.",
  },
} as const;

function failedCopy(failureReason: "INVALID_TEMPLATE" | null) {
  return failureReason === "INVALID_TEMPLATE"
    ? {
        title: "La plantilla no tiene el formato esperado",
        description: "Descarga una plantilla vigente y copia los datos sin modificar la fila de versión ni las cabeceras.",
        alertTitle: "Vuelve a cargar el archivo con una plantilla vigente",
        alertMessage: "La fila de versión o las cabeceras no coinciden con la plantilla esperada. Descarga una plantilla nueva, copia tus datos sin cambiar esas filas y crea una importación nueva.",
      }
    : {
        title: statusCopy.FAILED.title,
        description: statusCopy.FAILED.description,
        alertTitle: "Revisa la plantilla antes de volver a intentar",
        alertMessage: "Descarga una plantilla nueva, copia tus datos sin modificar la fila de versión ni las cabeceras y crea una importación nueva. Si el problema continúa, comparte el Correlation ID con soporte.",
      };
}

function displayDate(value: string | null) {
  if (value === null || Number.isNaN(Date.parse(value))) return "No disponible";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CompanyClientImportResultPage({
  importId,
}: {
  importId: string;
}) {
  const result = useCustomerImportResult(importId);
  const currentStatus = result.job?.status === "FAILED" ? failedCopy(result.job.failureReason) : null;
  if (result.forbidden)
    return (
      <AsyncStateCard
        tone="error"
        title="No tienes permisos"
        description="No tienes permiso para consultar esta importación."
        actionLabel="Volver a clientes"
        onAction={() => navigate("/company/clients")}
      />
    );
  if (result.job === null && !result.loading && result.error?.status === 404)
    return (
      <AsyncStateCard
        tone="error"
        title="No encontramos la importación"
        description="La importación no existe o ya no está disponible."
        actionLabel="Volver a la carga"
        onAction={() => navigate("/company/customer-imports")}
      />
    );
  return (
    <section
      className="customer-import"
      aria-labelledby="customer-import-result-title"
    >
      <header className="customer-import__heading">
        <div>
          <h1 id="customer-import-result-title">Resultado de importación</h1>
          <p>Consulta el avance y el resumen del archivo enviado.</p>
        </div>
      </header>
      {result.loading && result.job === null ? (
        <AsyncStateCard
          title="Cargando resultado"
          description="Estamos consultando el estado de la importación."
        />
      ) : null}
      {result.error !== null && !result.stale ? (
        <InlineAlert
          variant="error"
          title="No pudimos consultar el resultado"
          message={messages[result.error.status] ?? messages[500]}
          action={{ label: "Reintentar", onClick: () => void result.refresh() }}
          {...(result.error.correlationId
            ? { correlationId: result.error.correlationId }
            : {})}
        />
      ) : null}
      {result.job !== null ? (
        <section
          className="customer-import__status"
          aria-live="polite"
          aria-label="Estado de importación"
        >
          <div className="customer-import__result-heading">
            <div>
              <h2>{currentStatus?.title ?? statusCopy[result.job.status].title}</h2>
              <p>{currentStatus?.description ?? statusCopy[result.job.status].description}</p>
            </div>
            {result.polling ? (
              <RefreshCw
                aria-label="Actualizando estado"
                className="customer-import__spin customer-import__spin--inline"
              />
            ) : null}
          </div>
          {result.stale ? (
            <InlineAlert
              variant="warning"
              title="Información sin actualizar"
              message="Mostramos el último resultado disponible. Intenta actualizarlo nuevamente."
              action={{
                label: "Actualizar",
                onClick: () => void result.refresh(),
              }}
              {...(result.error?.correlationId
                ? { correlationId: result.error.correlationId }
                : {})}
            />
          ) : null}
          <p className="customer-import__updated">
            Última actualización: {displayDate(result.lastUpdatedAt)}.
          </p>
          <dl>
            <div>
              <dt>Filas recibidas</dt>
              <dd>{result.job.totalRows ?? "No disponible"}</dd>
            </div>
            <div>
              <dt>Aceptadas</dt>
              <dd>{result.job.acceptedRows}</dd>
            </div>
            <div>
              <dt>Rechazadas</dt>
              <dd>{result.job.rejectedRows}</dd>
            </div>
          </dl>
          {result.job.status === "COMPLETED" && result.job.rejectedRows === 0 ? (
            <div className="customer-import__result-actions">
              <button
                className="customer-import__back"
                type="button"
                onClick={() => navigate("/company/customer-imports")}
              >
                <ArrowLeft aria-hidden="true" />
                Volver a cargas
              </button>
            </div>
          ) : null}
          {result.job.status === "FAILED" ? (
            <div className="customer-import__result-actions">
              <InlineAlert
                className="customer-import__result-alert"
                variant="error"
                title={currentStatus?.alertTitle ?? "Revisa la plantilla antes de volver a intentar"}
                message={currentStatus?.alertMessage ?? "Descarga una plantilla nueva, copia tus datos sin modificar la fila de versión ni las cabeceras y crea una importación nueva. Si el problema continúa, comparte el Correlation ID con soporte."}
              />
              {result.job.rejectedRows === 0 ? (
                <button
                  className="customer-import__back"
                  type="button"
                  onClick={() => navigate("/company/customer-imports")}
                >
                  <ArrowLeft aria-hidden="true" />
                  Volver a cargas
                </button>
              ) : null}
            </div>
          ) : null}
          {result.job.rejectedRows > 0 && !result.polling ? (
            <div className="customer-import__errors">
              <div>
                <h3>Archivo de filas rechazadas</h3>
                <p>
                  {result.expired
                    ? "El archivo de errores venció y ya no está disponible."
                    : result.job.errorFileExpiresAt
                      ? `Disponible hasta ${displayDate(result.job.errorFileExpiresAt)}.`
                      : "Disponible para descargar mientras el servidor lo conserve."}
                </p>
              </div>
              <div className="customer-import__errors-actions">
                <button
                  className="customer-import__secondary"
                  type="button"
                  onClick={() => void result.downloadErrors()}
                  disabled={result.downloading || result.expired}
                >
                  <Download aria-hidden="true" />
                  {result.downloading ? "Descargando…" : "Descargar errores"}
                </button>
                <button
                  className="customer-import__back"
                  type="button"
                  onClick={() => navigate("/company/customer-imports")}
                >
                  <ArrowLeft aria-hidden="true" />
                  Volver a cargas
                </button>
              </div>
            </div>
          ) : null}
          {result.expired ? (
            <InlineAlert
              variant="warning"
              title="Archivo vencido"
              message={messages[410]}
            />
          ) : null}
          {result.error !== null && !result.stale ? (
            <InlineAlert
              variant="error"
              title="No pudimos descargar el archivo"
              message={messages[result.error.status] ?? messages[500]}
              action={{
                label: "Reintentar",
                onClick: () => void result.downloadErrors(),
              }}
              {...(result.error.correlationId
                ? { correlationId: result.error.correlationId }
                : {})}
            />
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
