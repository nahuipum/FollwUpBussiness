import { useState } from "react";
import type { ApiError } from "../../../lib/api";
import { InlineAlert } from "../../../shared/ui/error-ui/components";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import type { CompanyCurrency, CreateCompanyInput } from "../types";

type Props = {
  busy: boolean;
  error: ApiError | null;
  currencies: readonly CompanyCurrency[];
  currenciesLoading: boolean;
  currenciesUnavailable: boolean;
  onRetryCurrencies: () => void;
  onClose: () => void;
  onSubmit: (input: CreateCompanyInput) => void;
};

export function CreateCompanyModal({
  busy,
  error,
  currencies,
  currenciesLoading,
  currenciesUnavailable,
  onRetryCurrencies,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState({
    legalName: "",
    tradeName: "",
    taxId: "",
    timezone: "America/Lima",
    currency: "",
  });
  const fieldErrors = new Set(
    error?.fieldErrors.map(({ field }) => field) ?? [],
  );
  const invalid = (field: string) =>
    error?.status === 422 && fieldErrors.has(field);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.legalName.trim() || !form.currency) return;
    onSubmit({
      legalName: form.legalName.trim(),
      ...(form.tradeName.trim() ? { tradeName: form.tradeName.trim() } : {}),
      ...(form.taxId.trim() ? { taxId: form.taxId.trim() } : {}),
      timezone: form.timezone,
      currency: form.currency,
    });
  };
  return (
    <ModalSurface
      titleId="create-company-title"
      onDismiss={busy ? () => undefined : onClose}
    >
      <form onSubmit={submit}>
        <ModalHeader
          module="Empresas"
          title="Crear empresa"
          titleId="create-company-title"
          description="Registra los datos iniciales para crear una nueva empresa en plataforma."
          onClose={onClose}
          closeDisabled={busy}
          className="company-modal__header"
        />
        <div className="company-modal__body">
          {error?.status === 422 && (
            <InlineAlert
              variant="error"
              title="Revisa los campos marcados"
              message="La razón social debe tener entre 2 y 200 caracteres; la moneda debe seleccionarse del catálogo."
              {...(error.correlationId
                ? { correlationId: error.correlationId }
                : {})}
            />
          )}
          <div className="company-form-grid">
            <Field
              label="Razón social"
              value={form.legalName}
              onChange={(legalName) => setForm({ ...form, legalName })}
              required
              invalid={invalid("legalName")}
              minLength={2}
              maxLength={200}
            />
            <Field
              label="Nombre comercial"
              value={form.tradeName}
              onChange={(tradeName) => setForm({ ...form, tradeName })}
              maxLength={200}
            />
            <Field
              label="Identificador fiscal"
              value={form.taxId}
              onChange={(taxId) => setForm({ ...form, taxId })}
              maxLength={30}
            />
            <div className="company-form-field">
              <span>Zona horaria</span>
              <VisualSelect
                value={form.timezone}
                onChange={(timezone) => setForm({ ...form, timezone })}
                ariaLabel="Zona horaria"
                options={[{ value: "America/Lima", label: "America/Lima" }]}
              />
            </div>
            <div className="company-form-field">
              <span>Moneda</span>
              <VisualSelect
                value={form.currency}
                onChange={(currency) => setForm({ ...form, currency })}
                ariaLabel="Moneda"
                disabled={currenciesLoading || currenciesUnavailable}
                invalid={invalid("settings.currency")}
                options={[
                  { value: "", label: currenciesLoading ? "Cargando monedas…" : currenciesUnavailable ? "No se pudieron cargar las monedas" : "Selecciona una moneda" },
                  ...currencies.map((currency) => ({ value: currency.code, label: `${currency.code} — ${currency.displayName}` })),
                ]}
              />
              {currenciesUnavailable && (
                <button
                  type="button"
                  className="company-button company-button--secondary"
                  onClick={onRetryCurrencies}
                >
                  Reintentar cargar monedas
                </button>
              )}
            </div>
          </div>
          <p className="company-information">
            Configuración inicial: radio de geocerca 100 m y tracking cada 60 s.
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
            className="company-button company-button--primary"
            disabled={busy}
          >
            {busy ? "Creando…" : "Crear empresa"}
          </button>
        </footer>
      </form>
    </ModalSurface>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  invalid = false,
  minLength,
  maxLength,
  pattern,
  title,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  invalid?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  title?: string;
}) {
  const id = `company-${label.replaceAll(" ", "-").toLowerCase()}`;
  return (
    <label htmlFor={id}>
      {label}
      {!required && " (opcional)"}
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        aria-invalid={invalid || undefined}
        {...(minLength === undefined ? {} : { minLength })}
        {...(maxLength === undefined ? {} : { maxLength })}
        {...(pattern === undefined ? {} : { pattern })}
        {...(title === undefined ? {} : { title })}
      />
    </label>
  );
}
