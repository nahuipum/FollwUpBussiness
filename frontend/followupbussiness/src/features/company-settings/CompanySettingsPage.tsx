import { useEffect, useState } from "react";
import { getSessionIdentity } from "../auth/auth";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { ReadOnlyNotice } from "../../shared/ui/ReadOnlyNotice";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { useCompanySettings } from "./hooks/useCompanySettings";
import type { UpdateCompanySettingsInput } from "./types";
import "./styles/company-settings.css";
import "./styles/company-settings-standard.css";

export function CompanySettingsPage() {
  const data = useCompanySettings();
  const canManage =
    getSessionIdentity()?.roles.includes("COMPANY_ADMIN") ?? false;
  const [form, setForm] = useState<{
    etag: string;
    generation: number;
    values: UpdateCompanySettingsInput;
  } | null>(null);
  useEffect(() => {
    if (data.snapshot)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el formulario controlado debe reflejar el snapshot y su ETag vigentes.
      setForm({
          etag: data.snapshot.etag,
          generation: data.sessionGeneration,
          values: {
            currency: data.snapshot.settings.currency,
            saleEditWindowMinutes: data.snapshot.settings.saleEditWindowMinutes,
          },
        });
  }, [data.sessionGeneration, data.snapshot]);
  if (data.loading && !data.snapshot)
    return <TableLoadingIndicator label="Cargando configuración" />;
  if (data.error && !data.snapshot)
    return (
      <AsyncStateCard
        tone="error"
        title={
          data.error.status === 403
            ? "No tienes permisos"
            : "Ocurrió un problema temporal"
        }
        description={
          data.error.status === 403
            ? "No tienes permiso para consultar la configuración."
            : "No pudimos mostrar la configuración. Inténtalo más tarde."
        }
        actionLabel="Reintentar"
        onAction={data.retry}
      />
    );
  if (
    !data.snapshot ||
    !form ||
    form.etag !== data.snapshot.etag ||
    form.generation !== data.sessionGeneration
  )
    return (
      <TableLoadingIndicator label="Sincronizando configuración vigente" />
    );
  const { settings } = data.snapshot;
  const values = form.values;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      form.etag !== data.snapshot?.etag ||
      form.generation !== data.sessionGeneration
    )
      return;
    if (
      /^[A-Z]{3}$/.test(values.currency) &&
      (values.saleEditWindowMinutes === null ||
        (Number.isInteger(values.saleEditWindowMinutes) &&
          values.saleEditWindowMinutes >= 0 &&
          values.saleEditWindowMinutes <= 10080))
    )
      void data.save(values);
  };
  return (
    <section
      className="company-settings"
      aria-labelledby="company-settings-title"
    >
      <header>
        <h1 id="company-settings-title">Configuración</h1>
        <p>
          Consulta las políticas operativas de geocerca y tracking de la
          empresa.
        </p>
      </header>
      {data.conflict && (
        <InlineAlert
          variant="warning"
          className="company-settings__alert"
          title="La configuración cambió"
          message="Recarga y revisa los valores antes de intentar guardar nuevamente."
          action={{
            label: "Recargar y revisar",
            onClick: data.reloadAfterConflict,
          }}
        />
      )}
      {data.error && (
        <InlineAlert
          variant="error"
          className="company-settings__alert"
          title={
            data.error.status === 422
              ? "Revisa la información ingresada"
              : data.error.status === 403
                ? "No tienes permiso para realizar esta acción"
                : "No pudimos guardar los cambios"
          }
          message={
            data.error.status === 422
              ? "El plazo debe ser un número entero entre 0 y 10 080 minutos."
              : "La configuración no fue modificada."
          }
          {...(data.error.correlationId
            ? { correlationId: data.error.correlationId }
            : {})}
        />
      )}
      <div className="company-settings__grid">
        <form className="company-settings__card" onSubmit={submit}>
          <h2>Configuración operativa</h2>
          {!canManage && <ReadOnlyNotice />}
          <label>
            Zona horaria
            <input
              value={settings.timezone}
              disabled
            />
          </label>
          <label>
            Moneda
            <input
              value={values.currency}
              disabled
              maxLength={3}
              pattern="[A-Z]{3}"
              required
            />
          </label>
          <label>
            Plazo para corregir una venta registrada (minutos)
            <input
              type="number"
              value={values.saleEditWindowMinutes ?? ""}
              disabled={!canManage || data.saving}
              min="0"
              max="10080"
              onChange={(event) =>
                setForm({
                  ...form,
                  values: {
                    ...values,
                    saleEditWindowMinutes:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  },
                })
              }
            />
          </label>
          {canManage && (
            <button type="submit" disabled={data.saving}>
              {data.saving ? "Guardando…" : "Guardar cambios"}
            </button>
          )}
        </form>
        <aside
          className="company-settings__card"
          aria-label="Política de geocerca y tracking"
        >
          <h2>Geocerca y tracking</h2>
          <dl>
            <div>
              <dt>Radio de geocerca</dt>
              <dd>{settings.geofenceRadiusMeters} m</dd>
            </div>
            <div>
              <dt>Frecuencia de tracking</dt>
              <dd>Cada {settings.trackingIntervalSeconds} s</dd>
            </div>
            <div>
              <dt>Retención de ubicación</dt>
              <dd>{settings.locationRetentionDays ?? 90} días</dd>
            </div>
          </dl>
          <p>
            La ubicación se procesa solo durante la jornada activa y no se muestra aquí.
          </p>
        </aside>
      </div>
      {data.lastUpdated && (
        <time
          className="company-settings__updated"
          dateTime={data.lastUpdated.toISOString()}
          role="status"
        >
          Última actualización: {data.lastUpdated.toLocaleTimeString()}
        </time>
      )}
      {data.loading && (
        <TableLoadingIndicator
          label="Actualizando configuración; los datos mostrados pueden no estar vigentes"
          compact
        />
      )}
    </section>
  );
}
