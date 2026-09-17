import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle, LockKeyhole, TriangleAlert } from "lucide-react";
import { getSessionIdentity } from "../auth/auth";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { Button } from "../../shared/ui/Button";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { ReadOnlyNotice } from "../../shared/ui/ReadOnlyNotice";
import { TimeField } from "../../shared/ui/TimeField";
import { useCompanySettings } from "./hooks/useCompanySettings";
import type { UpdateCompanySettingsInput } from "./types";
import "./styles/company-settings.css";

type FormState = { etag: string; generation: number; values: UpdateCompanySettingsInput };

export function CompanySettingsPage() {
  const roles = getSessionIdentity()?.roles ?? [];
  if (!roles.includes("COMPANY_ADMIN") && !roles.includes("SUPERVISOR")) return <section className="company-settings" aria-labelledby="company-settings-title"><SettingsHeader /><AsyncStateCard variant="golden" tone="error" icon={<LockKeyhole />} title="No tienes permisos" description="No tienes permiso para consultar la configuración de la empresa." /></section>;
  return <CompanySettingsContent canManage={roles.includes("COMPANY_ADMIN")} />;
}

function CompanySettingsContent({ canManage }: { canManage: boolean }) {
  const data = useCompanySettings();
  const [form, setForm] = useState<FormState | null>(null);
  useEffect(() => {
    if (!data.snapshot) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el formulario controlado debe reflejar el snapshot y su ETag vigentes.
    setForm({ etag: data.snapshot.etag, generation: data.sessionGeneration, values: { currency: data.snapshot.settings.currency, saleEditWindowMinutes: data.snapshot.settings.saleEditWindowMinutes, planningDayStart: data.snapshot.settings.planningDayStart, planningDayEnd: data.snapshot.settings.planningDayEnd } });
  }, [data.sessionGeneration, data.snapshot]);

  if (data.loading && !data.snapshot) return <section className="company-settings" aria-labelledby="company-settings-title"><SettingsHeader /><section className="company-settings__loading" aria-busy="true" aria-live="polite"><span className="company-settings__sr-only">Cargando configuración</span><span /><span /><div><i /><i /></div><span /><div><i /><i /></div></section></section>;
  if (data.error && !data.snapshot) {
    const forbidden = data.error.status === 403;
    return <section className="company-settings" aria-labelledby="company-settings-title"><SettingsHeader /><AsyncStateCard variant="golden" tone="error" icon={forbidden ? <LockKeyhole /> : <CircleAlert />} title={forbidden ? "No tienes permisos" : "Ocurrió un problema temporal"} description={forbidden ? "No tienes permiso para consultar la configuración de la empresa." : "No pudimos mostrar la configuración. Inténtalo de nuevo."} {...(forbidden ? {} : { actionLabel: "Reintentar", onAction: data.retry })} /></section>;
  }
  if (!data.snapshot || !form || form.etag !== data.snapshot.etag || form.generation !== data.sessionGeneration) return <section className="company-settings" aria-labelledby="company-settings-title"><SettingsHeader /><AsyncStateCard variant="golden" title="Sincronizando configuración vigente" description="Estamos verificando los valores de la empresa." /></section>;

  const { settings } = data.snapshot;
  const values = form.values;
  const planningPairInvalid = (values.planningDayStart === null) !== (values.planningDayEnd === null);
  const planningOrderInvalid = values.planningDayStart !== null && values.planningDayEnd !== null && values.planningDayStart >= values.planningDayEnd;
  const windowInvalid = values.saleEditWindowMinutes !== null && (!Number.isInteger(values.saleEditWindowMinutes) || values.saleEditWindowMinutes < 0 || values.saleEditWindowMinutes > 10080);
  const isDirty = values.currency !== settings.currency || values.saleEditWindowMinutes !== settings.saleEditWindowMinutes || values.planningDayStart !== settings.planningDayStart || values.planningDayEnd !== settings.planningDayEnd;
  const editingBlocked = !canManage || data.saving || data.loading || data.conflict || data.stale || data.error?.status === 403;
  const version = data.snapshot.etag.replaceAll('"', "");
  const lastUpdatedAt = data.lastUpdated;
  const lastUpdated = lastUpdatedAt ? `${String(lastUpdatedAt.getHours()).padStart(2, "0")}:${String(lastUpdatedAt.getMinutes()).padStart(2, "0")}` : null;
  const updateValues = (next: UpdateCompanySettingsInput) => setForm({ ...form, values: next });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingBlocked && isDirty && !planningPairInvalid && !planningOrderInvalid && !windowInvalid && form.etag === data.snapshot?.etag && form.generation === data.sessionGeneration) void data.save(values);
  };

  return <section className="company-settings" aria-labelledby="company-settings-title">
    <SettingsHeader />
    <div className="company-settings__meta" role="status"><StatusBadge conflict={data.conflict} saving={data.saving || data.loading} stale={data.stale} succeeded={data.saveSucceeded} dirty={isDirty} /><span className="company-settings__separator" aria-hidden="true" /><span><strong>Versión:</strong> {version}</span>{lastUpdated && lastUpdatedAt && <><span className="company-settings__separator" aria-hidden="true" /><time dateTime={lastUpdatedAt.toISOString()}>Última actualización{data.loading || data.stale ? " conocida" : ""}: {lastUpdated}</time></>}</div>
    {data.loading && <InlineAlert visual="golden" variant="info" className="company-settings__alert" title="Actualizando configuración" message="Los valores mostrados podrían no estar vigentes. Espera la nueva versión antes de editar." />}
    {data.stale && data.error && <InlineAlert visual="golden" variant="warning" icon={<TriangleAlert />} className="company-settings__alert" title="Datos no vigentes" message="No pudimos actualizar la configuración. Mostramos la última versión confirmada; recárgala antes de editar." action={{ label: "Reintentar", onClick: data.retry }} />}
    {data.conflict && <InlineAlert visual="golden" variant="warning" icon={<TriangleAlert />} className="company-settings__alert" title="La configuración cambió en otra sesión" message="No guardamos tus cambios. Recarga la versión vigente y revisa sus valores antes de volver a guardar." action={{ label: "Recargar y revisar", onClick: data.reloadAfterConflict }} />}
    {!data.stale && !data.conflict && data.error && <InlineAlert visual="golden" variant="error" className="company-settings__alert" title={data.error.status === 422 ? "Revisa la información ingresada" : data.error.status === 403 ? "No tienes permiso para realizar esta acción" : "No pudimos guardar los cambios"} message={data.error.status === 422 ? "El plazo debe ser un número entero entre 0 y 10 080 minutos." : "La configuración no fue modificada. Revisa tu conexión e inténtalo nuevamente."} {...(data.error.correlationId ? { correlationId: data.error.correlationId } : {})} />}
    {data.saveSucceeded && <InlineAlert visual="golden" variant="info" className="company-settings__alert" title="Cambios guardados" message="La configuración quedó actualizada. La siguiente edición usará la nueva versión." />}
    {!canManage && <ReadOnlyNotice variant="golden" title="Vista de solo lectura" description="Puedes consultar los parámetros. Solo administración de empresa puede guardar cambios." />}
    <div className={`company-settings__grid${data.conflict || data.stale || data.loading ? " company-settings__grid--stale" : ""}`}>
      <form className="company-settings__card company-settings__form" onSubmit={submit} noValidate>
        <header className="company-settings__card-head"><div><h2>Configuración operativa</h2><p>La jornada se usa para planificar rutas. El plazo determina durante cuánto tiempo puede corregirse una venta registrada.</p></div><span className={`company-settings__badge company-settings__badge--${canManage ? "info" : "neutral"}`}>{canManage ? "Editable" : "Solo consulta"}</span></header>
        <section className="company-settings__section" aria-labelledby="planning-title"><div><h3 id="planning-title">Jornada de planificación</h3><p>Define inicio y fin como una pareja. No hay un horario predeterminado.</p></div><fieldset disabled={editingBlocked}><legend className="company-settings__sr-only">Horario de planificación</legend><div className="company-settings__pair"><TimeField variant="golden" showClockIcon={!editingBlocked} disabled={editingBlocked} invalid={planningOrderInvalid} describedBy={planningPairInvalid ? "planning-pair-error" : planningOrderInvalid ? "planning-order-error" : "planning-help"} label="Inicio de la jornada" value={values.planningDayStart ?? ""} onValueChange={(planningDayStart) => updateValues({ ...values, planningDayStart: planningDayStart || null })} /><TimeField variant="golden" showClockIcon={!editingBlocked} disabled={editingBlocked} invalid={planningPairInvalid || planningOrderInvalid} describedBy={planningPairInvalid ? "planning-pair-error" : planningOrderInvalid ? "planning-order-error" : "planning-help"} label="Fin de la jornada" value={values.planningDayEnd ?? ""} onValueChange={(planningDayEnd) => updateValues({ ...values, planningDayEnd: planningDayEnd || null })} /></div></fieldset>{planningPairInvalid ? <p id="planning-pair-error" className="company-settings__field-error" role="alert">Completa el inicio y el fin de la jornada.</p> : planningOrderInvalid ? <p id="planning-order-error" className="company-settings__field-error" role="alert">El inicio de la jornada debe ser anterior al fin.</p> : <p id="planning-help" className="company-settings__help">Ambos horarios deben quedar vacíos o completos; el inicio debe ser anterior al fin.</p>}</section>
        <section className="company-settings__section" aria-labelledby="sales-title"><div><h3 id="sales-title">Corrección de ventas</h3><p>Plazo para corregir una venta registrada.</p></div><label className="company-settings__field" htmlFor="sale-window">Plazo en minutos<input id="sale-window" type="number" min="0" max="10080" step="1" value={values.saleEditWindowMinutes ?? ""} disabled={editingBlocked} aria-invalid={windowInvalid || undefined} aria-describedby={windowInvalid ? "window-error" : "window-help"} onChange={(event) => updateValues({ ...values, saleEditWindowMinutes: event.target.value === "" ? null : Number(event.target.value) })} /></label>{windowInvalid ? <p id="window-error" className="company-settings__field-error" role="alert">El plazo debe ser un número entero entre 0 y 10 080 minutos.</p> : <p id="window-help" className="company-settings__help">Número entero de 0 a 10 080 minutos.</p>}</section>
        <section className="company-settings__section" aria-labelledby="company-data-title"><div><h3 id="company-data-title">Datos de la empresa</h3><p>Se consultan aquí; la pantalla actual no permite cambiarlos.</p></div><dl className="company-settings__static"><div><dt>Zona horaria</dt><dd>{settings.timezone}</dd></div><div><dt>Moneda</dt><dd>{values.currency}</dd></div></dl></section>
        {canManage && <footer className="company-settings__actions"><p>Los cambios se guardan sobre la versión consultada. Si otra sesión la actualiza, tendrás que recargar y revisar.</p><Button variant="primary" type="submit" disabled={editingBlocked || !isDirty || planningPairInvalid || planningOrderInvalid || windowInvalid} aria-busy={data.saving}>{data.saving && <LoaderCircle className="company-settings__spinner" aria-hidden="true" />}{data.saving ? "Guardando…" : "Guardar cambios"}</Button></footer>}
      </form>
      <aside className="company-settings__card company-settings__policy" aria-labelledby="policy-title"><header className="company-settings__card-head"><div><h2 id="policy-title">Geocerca y tracking</h2><p>Políticas vigentes del MVP. Son informativas y no se editan en esta pantalla.</p></div><span className="company-settings__badge company-settings__badge--neutral">Política vigente</span></header><dl className="company-settings__policy-list"><div><dt>Radio de geocerca <strong>{settings.geofenceRadiusMeters} m</strong></dt><dd>El servidor usa este radio para validar la proximidad de una visita.</dd></div><div><dt>Frecuencia de captura <strong>{settings.trackingIntervalSeconds} s</strong></dt><dd>Se toma una muestra cada 60 segundos únicamente durante la jornada activa.</dd></div><div><dt>Retención de ubicación <strong>{settings.locationRetentionDays ?? 90} días</strong></dt><dd>El historial exacto aceptado se elimina físicamente al vencer este plazo.</dd></div></dl><InlineAlert visual="golden" className="company-settings__privacy" variant="info" title="Privacidad de ubicación" message="Esta pantalla solo muestra la política. No presenta coordenadas, personas ni ubicaciones actuales." /></aside>
    </div>
  </section>;
}

function StatusBadge({ conflict, saving, stale, succeeded, dirty }: { conflict: boolean; saving: boolean; stale: boolean; succeeded: boolean; dirty: boolean }) {
  const state = conflict ? ["warning", "Revisión requerida"] : stale ? ["warning", "Datos no vigentes"] : saving ? ["info", "Actualizando"] : succeeded ? ["success", "Guardado"] : dirty ? ["warning", "Cambios pendientes"] : ["neutral", "Sin cambios"];
  return <span className={`company-settings__badge company-settings__badge--${state[0]}`}>{succeeded && <CheckCircle2 aria-hidden="true" />}{state[1]}</span>;
}

function SettingsHeader() {
  return <header className="company-settings__head"><span className="company-settings__eyebrow">Workspace de empresa</span><h1 id="company-settings-title">Configuración</h1><p>Consulta los parámetros de operación y las políticas vigentes de geocerca y ubicación de la empresa.</p></header>;
}
