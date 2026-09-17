import { AlertTriangle, Check, Download, Info, LockKeyhole, Play } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { navigate } from "../../app/navigation";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { Button } from "../../shared/ui/Button";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { FileUploadField } from "../../shared/ui/FileUploadField";
import { useCustomerImport } from "./hooks/useCustomerImport";
import type { FileValidationFailure, ImportFailure, TemplateFailure } from "./types";
import "./styles/company-client-import.css";

const importMessages: Record<number, { title: string; message: string }> = {
  400: { title: "No pudimos importar el archivo", message: "No pudimos procesar el archivo. Descarga una plantilla nueva e inténtalo otra vez." },
  409: { title: "Importación equivalente", message: "Ya existe una importación equivalente. No se reenvió el archivo." },
  413: { title: "Archivo demasiado grande", message: "El archivo supera el límite de 10 MiB." },
  415: { title: "Formato no admitido", message: "Selecciona un archivo CSV UTF-8 o XLSX sin macros." },
  422: { title: "Plantilla incompatible", message: "El archivo no cumple los requisitos de la plantilla." },
};

const fileMessages: Record<FileValidationFailure["code"], string> = {
  TOO_LARGE: "El archivo supera el límite de 10 MiB. Selecciona un archivo más pequeño.",
  INVALID_EXTENSION: "La extensión no está permitida. Selecciona un archivo CSV o XLSX.",
  INVALID_MIME: "El tipo del archivo no coincide con CSV UTF-8 ni XLSX. Selecciona otro archivo.",
  MACROS_NOT_ALLOWED: "Los archivos XLSM o con macros no están permitidos. Selecciona un XLSX sin macros.",
};

function importErrorCopy(error: ImportFailure) {
  return importMessages[error.status] ?? {
    title: "No pudimos completar la operación",
    message: "No pudimos completar la operación. Inténtalo nuevamente.",
  };
}

function templateErrorCopy(error: TemplateFailure) {
  if (error.status === 406) return {
    title: "Formato de plantilla no disponible",
    message: "La representación solicitada no está disponible. Inténtalo nuevamente.",
    action: "Volver a comprobar",
  };
  if (error.operation === "download") return {
    title: "No pudimos descargar la plantilla",
    message: "La versión vigente sigue comprobada. Puedes usar una copia válida que ya tengas o intentar la descarga otra vez.",
    action: "Intentar la descarga",
  };
  return {
    title: "No pudimos comprobar la plantilla vigente",
    message: "No puedes iniciar la importación hasta restablecer esta comprobación.",
    action: "Volver a comprobar",
  };
}

export function CompanyClientImportPage() {
  const importer = useCustomerImport();
  const transitioning = importer.job !== null;
  const busy = importer.submitting || transitioning;
  const submitDisabled = !importer.file || !importer.templateVersion || importer.checkingTemplateVersion || importer.fileError !== null || busy;

  useEffect(() => {
    if (importer.job !== null)
      navigate(`/company/customer-imports/${encodeURIComponent(importer.job.id)}`, { replace: true });
  }, [importer.job]);

  if (importer.forbidden) return <CompanyClientImportForbidden />;

  const templateError = importer.templateFailure ? templateErrorCopy(importer.templateFailure) : null;
  const submitError = importer.error ? importErrorCopy(importer.error) : null;

  return (
    <section className="customer-import-upload" aria-labelledby="customer-import-title">
      <header className="customer-import-upload__heading">
        <span className="customer-import-upload__eyebrow">Importación de clientes</span>
        <h1 id="customer-import-title">Carga de clientes</h1>
        <p>Usa tu plantilla vigente o descarga una nueva, carga un archivo CSV o XLSX y consulta el avance de la importación.</p>
      </header>

      <section className="customer-import-upload__panel" aria-labelledby="customer-import-flow-title" aria-busy={busy}>
        <h2 id="customer-import-flow-title" className="sr-only">Preparar e iniciar una importación de clientes</h2>
        <ol className="customer-import-upload__flow">
          <ImportStep number={1} title="Descarga la plantilla" description="Si ya tienes una plantilla vigente, puedes usarla directamente. Verificamos su versión antes de importar sin descargarla de nuevo." action={
            <Button className="customer-import-upload__template-action" onClick={() => void importer.downloadTemplate()} disabled={importer.loadingTemplate} aria-busy={importer.loadingTemplate} leadingIcon={importer.loadingTemplate ? <span className="customer-import-upload__spinner" aria-hidden="true" /> : <Download aria-hidden="true" />}>
              {importer.loadingTemplate ? "Descargando…" : "Descargar plantilla"}
            </Button>
          }>
            {importer.checkingTemplateVersion && <p className="customer-import-upload__inline-status" role="status" aria-live="polite"><span className="customer-import-upload__spinner" aria-hidden="true" />Comprobando la versión vigente de la plantilla…</p>}
            {!importer.checkingTemplateVersion && importer.templateVersion && !importer.loadingTemplate && <p className="customer-import-upload__inline-status" role="status"><span className="customer-import-upload__status-check" aria-hidden="true"><Check /></span>{importer.templateDownloaded ? "Descarga completada. La plantilla está lista para usar." : "Plantilla vigente comprobada. Puedes usar una copia que ya descargaste."}</p>}
            {templateError && importer.templateFailure && <InlineAlert className="customer-import-upload__alert" variant="error" icon={<AlertTriangle />} title={templateError.title} message={templateError.message} {...(importer.templateFailure.correlationId ? { correlationId: importer.templateFailure.correlationId } : {})} action={{ label: templateError.action, onClick: importer.templateFailure.operation === "download" && importer.templateFailure.status !== 406 ? () => void importer.downloadTemplate() : () => void importer.refreshTemplateVersion() }} />}
          </ImportStep>

          <ImportStep number={2} title="Selecciona el archivo" description="Solo aceptamos archivos CSV UTF-8 o XLSX de hasta 10 MiB.">
            <FileUploadField
              label="Elige un archivo para importar"
              hint="CSV UTF-8 o XLSX · Máximo 10 MiB"
              accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              file={importer.file}
              onChange={importer.selectFile}
              disabled={busy}
              error={importer.fileError ? fileMessages[importer.fileError.code] : null}
              statusMessage={importer.fileRemoved ? "Archivo quitado. La pantalla no conserva su contenido." : null}
            />
          </ImportStep>

          <ImportStep number={3} title="Configura la aceptación" description="Decide cómo tratar el trabajo si el servidor rechaza alguna fila.">
            <label className={`customer-import-upload__acceptance${busy ? " customer-import-upload__acceptance--disabled" : ""}`}>
              <input id="partial-acceptance" type="checkbox" checked={importer.partialAcceptance} onChange={(event) => importer.setPartialAcceptance(event.target.checked)} disabled={busy} aria-describedby="partial-acceptance-help" />
              <span><strong>Importar las filas válidas</strong><small id="partial-acceptance-help">Las filas rechazadas no crearán clientes; puedes revisar el resultado del trabajo.</small></span>
            </label>
            {!importer.partialAcceptance && <p className="customer-import-upload__acceptance-detail">Con esta opción desmarcada, si alguna fila es rechazada no se creará ningún cliente.</p>}
          </ImportStep>

          <ImportStep number={4} title="Inicia la importación" description="Revisa la selección y envía el archivo una sola vez.">
            {!busy && <aside className="customer-import-upload__destination" aria-label="Seguimiento de la importación"><Info aria-hidden="true" /><div><strong>Seguimiento automático</strong><p>Cuando el servidor acepte el archivo, te llevaremos a la pantalla de resultado para consultar el progreso.</p></div></aside>}
            {submitError && importer.error && <InlineAlert className="customer-import-upload__alert" variant="error" icon={<AlertTriangle />} title={submitError.title} message={submitError.message} {...(importer.error.correlationId ? { correlationId: importer.error.correlationId } : {})} action={{ label: "Cerrar aviso", onClick: importer.dismissError }} />}
            <div className="customer-import-upload__submit-body">
              {busy && <div className="customer-import-upload__progress" role="status" aria-live="polite"><span className="customer-import-upload__spinner" aria-hidden="true" />{transitioning ? "Archivo recibido. Abriendo la pantalla de resultado para ver el progreso…" : "Enviando el archivo. Al ser aceptado, abriremos automáticamente la pantalla donde podrás ver el progreso."}</div>}
              <div className="customer-import-upload__submit-row">
                <p>No cierres esta pantalla mientras se envía el archivo.</p>
                <Button variant="primary" className="customer-import-upload__submit" onClick={() => void importer.submit()} disabled={submitDisabled} aria-busy={busy} leadingIcon={busy ? <span className="customer-import-upload__spinner" aria-hidden="true" /> : <Play aria-hidden="true" />}>
                  {transitioning ? "Abriendo resultado…" : importer.submitting ? "Enviando…" : "Iniciar importación"}
                </Button>
              </div>
            </div>
          </ImportStep>
        </ol>
      </section>
    </section>
  );
}

export function CompanyClientImportForbidden({ returnPath = "/company/clients" }: { returnPath?: string }) {
  return <section className="customer-import-upload__forbidden">
    <AsyncStateCard
      variant="golden"
      tone="error"
      icon={<LockKeyhole />}
      headingLevel={1}
      title="No tienes permisos"
      description="La carga de clientes está disponible únicamente para administradores de empresa. No conservamos archivos seleccionados al cambiar de sesión o perfil."
      actionLabel="Volver a clientes"
      onAction={() => navigate(returnPath)}
    />
  </section>;
}

function ImportStep({ number, title, description, action, children }: { number: number; title: string; description: string; action?: ReactNode; children: ReactNode }) {
  const titleId = `customer-import-step-${number}`;
  return <li className="customer-import-upload__step">
    <span className="customer-import-upload__step-index" aria-hidden="true">{number}</span>
    <section className="customer-import-upload__step-copy" aria-labelledby={titleId}>
      <div className="customer-import-upload__step-head"><div><h2 id={titleId}>{title}</h2><p>{description}</p></div>{action}</div>
      <div className="customer-import-upload__step-body">{children}</div>
    </section>
  </li>;
}
