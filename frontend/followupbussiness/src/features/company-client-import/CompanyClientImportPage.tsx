import { Download, FileUp } from "lucide-react";
import { useEffect } from "react";
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
  useEffect(() => {
    if (importer.job !== null)
      navigate(`/company/customer-imports/${encodeURIComponent(importer.job.id)}`, { replace: true });
  }, [importer.job]);
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
            Usa tu plantilla vigente o descarga una nueva, carga un archivo CSV
            o XLSX y consulta el avance de la importación.
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
                Si ya tienes una plantilla vigente, puedes usarla directamente.
                Verificamos su versión antes de importar sin descargarla de nuevo.
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
        {importer.checkingTemplateVersion && (
          <p className="customer-import__updated" role="status">
            Verificando la versión vigente de la plantilla…
          </p>
        )}
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
            !importer.file ||
            !importer.templateVersion ||
            importer.checkingTemplateVersion ||
            importer.submitting
          }
        >
          <FileUp aria-hidden="true" />
          {importer.submitting ? "Enviando…" : "Iniciar importación"}
        </button>
      </section>
    </section>
  );
}
