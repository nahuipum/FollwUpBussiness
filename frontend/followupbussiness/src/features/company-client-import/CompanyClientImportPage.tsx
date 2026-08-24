import { Download, FileUp, RefreshCw } from "lucide-react";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { FileUploadField } from "../../shared/ui/FileUploadField";
import { navigate } from "../../app/navigation";
import { useCustomerImport } from "./hooks/useCustomerImport";
import "./styles/company-client-import.css";

const errorMessage = (status: number) =>
  ({
    400: "No pudimos procesar el archivo. Descarga una plantilla nueva e inténtalo otra vez.",
    409: "Ya existe una importación equivalente. No se reenvió el archivo.",
    413: "El archivo supera el límite de 10 MiB.",
    415: "Selecciona un archivo CSV UTF-8 o XLSX sin macros.",
    422: "El archivo no cumple los requisitos de la plantilla.",
  })[status] ?? "No pudimos completar la operación. Inténtalo nuevamente.";

export function CompanyClientImportPage() {
  const importer = useCustomerImport();
  if (importer.forbidden)
    return (
      <AsyncStateCard
        tone="error"
        title="No tienes permisos"
        description="No tienes permiso para cargar clientes."
        actionLabel="Volver a clientes"
        onAction={() => navigate("/company/clients")}
      />
    );
  return (
    <section
      className="customer-import"
      aria-labelledby="customer-import-title"
    >
      <header className="customer-import__heading">
        <div>
          <h1 id="customer-import-title">Carga de clientes</h1>
          <p>
            Descarga la plantilla, carga un archivo CSV o XLSX y consulta el
            avance de la importación.
          </p>
        </div>
      </header>
      <section className="customer-import__card" aria-label="Importar clientes">
        <section className="customer-import__step">
          <div className="customer-import__step-heading">
            <span>1</span>
            <div>
              <h2>Descarga la plantilla</h2>
              <p>
                Usa la plantilla vigente para validar el archivo sin mostrar su
                contenido en esta pantalla.
              </p>
            </div>
          </div>
          <button
            className="customer-import__secondary"
            type="button"
            onClick={() => void importer.downloadTemplate()}
            disabled={importer.loadingTemplate}
          >
            <Download aria-hidden="true" />
            {importer.loadingTemplate ? "Descargando…" : "Descargar plantilla"}
          </button>
        </section>
        <section className="customer-import__step">
          <div className="customer-import__step-heading">
            <span>2</span>
            <div>
              <h2>Selecciona el archivo</h2>
              <p>Solo aceptamos archivos CSV UTF-8 o XLSX de hasta 10 MiB.</p>
            </div>
          </div>
          <FileUploadField
            label="Elige un archivo para importar"
            hint="CSV UTF-8 o XLSX · Máximo 10 MiB"
            accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            file={importer.file}
            onChange={importer.selectFile}
            disabled={importer.submitting}
          />
        </section>
        <label className="customer-import__choice">
          <input
            type="checkbox"
            checked={importer.partialAcceptance}
            onChange={(event) =>
              importer.setPartialAcceptance(event.target.checked)
            }
            disabled={importer.submitting}
          />
          <span>
            <strong>Importar las filas válidas</strong>
            <small>
              Las filas rechazadas no crearán clientes; puedes revisar el
              resultado del trabajo.
            </small>
          </span>
        </label>
        {importer.error && (
          <InlineAlert
            variant="error"
            title="No pudimos importar el archivo"
            message={errorMessage(importer.error.status)}
            action={{ label: "Cerrar aviso", onClick: importer.retry }}
            {...(importer.error.correlationId
              ? { correlationId: importer.error.correlationId }
              : {})}
          />
        )}
        <button
          className="customer-import__primary"
          type="button"
          onClick={() => void importer.submit()}
          disabled={
            !importer.file || !importer.templateVersion || importer.submitting
          }
        >
          <FileUp aria-hidden="true" />
          {importer.submitting ? "Enviando…" : "Iniciar importación"}
        </button>
      </section>
      {importer.job && (
        <section
          className="customer-import__status"
          aria-live="polite"
          aria-label="Estado de importación"
        >
          <h2>
            {importer.polling
              ? "Procesando importación"
              : "Resultado de importación"}
          </h2>
          <p>
            {importer.polling
              ? "Estamos consultando el avance del trabajo."
              : `Estado: ${importer.job.status}.`}
          </p>
          <dl>
            <div>
              <dt>Filas recibidas</dt>
              <dd>{importer.job.totalRows}</dd>
            </div>
            <div>
              <dt>Aceptadas</dt>
              <dd>{importer.job.acceptedRows}</dd>
            </div>
            <div>
              <dt>Rechazadas</dt>
              <dd>{importer.job.rejectedRows}</dd>
            </div>
          </dl>
          {importer.polling && (
            <RefreshCw
              aria-label="Actualizando estado"
              className="customer-import__spin"
            />
          )}
        </section>
      )}
    </section>
  );
}
