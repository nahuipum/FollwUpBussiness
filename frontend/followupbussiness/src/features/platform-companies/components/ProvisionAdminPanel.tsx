import { Check, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import type { ApiError } from "../../../lib/api";
import { InlineAlert } from "../../../shared/ui/error-ui/components";
import type { Company, CompanyAdminInvitation, ProvisionInitialAdminInput } from "../types";
import { AdminInvitationList } from "./AdminInvitationList";

type Props = {
  company: Company;
  busy: boolean;
  error: ApiError | null;
  invitations: readonly CompanyAdminInvitation[];
  invitationsLoading: boolean;
  invitationsUnavailable: boolean;
  onBack: () => void;
  onSubmit: (input: ProvisionInitialAdminInput) => void;
};
export function ProvisionAdminPanel({
  company,
  busy,
  error,
  invitations,
  invitationsLoading,
  invitationsUnavailable,
  onBack,
  onSubmit,
}: Props) {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    username: "",
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.displayName.trim() && form.email.trim())
      onSubmit({
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        ...(form.username.trim() ? { username: form.username.trim() } : {}),
      });
  };
  const emailUnavailable = error?.status === 503;
  const showError =
    error?.status === 409 || error?.status === 422 || emailUnavailable;
  const errorTitle = emailUnavailable
    ? "Entrega de correo no disponible"
    : error?.status === 409
      ? "El administrador inicial ya fue provisionado"
      : "Revisa la información ingresada";
  const errorMessage = emailUnavailable
    ? "La mensajería SMTP está desactivada o no configurada. La invitación no fue creada."
    : error?.status === 409
      ? "No es necesario enviar una nueva invitación para esta empresa."
      : "Corrige los campos marcados e inténtalo nuevamente.";
  return (
    <>
      <header className="company-page-head">
        <div>
          <h1>Provisionar administrador inicial</h1>
          <p>Completa acceso inicial para la empresa recién creada.</p>
        </div>
        <button
          className="company-button company-button--secondary"
          type="button"
          onClick={onBack}
          disabled={busy}
        >
          Volver a empresas
        </button>
      </header>
      <ol className="company-stepper" aria-label="Progreso del onboarding">
        <li className="is-complete">
          <Check />
          Empresa creada
        </li>
        <li className="is-active">2. Administrador inicial</li>
        <li>3. Confirmación</li>
      </ol>
      <div className="company-flow">
        <form className="company-form-card" onSubmit={submit}>
          <h2>Administrador de {company.legalName}</h2>
          <p>Empresa activa y lista para recibir administrador inicial.</p>
          {showError && (
            <InlineAlert
              variant={error?.status === 409 ? "warning" : "error"}
              title={errorTitle}
              message={errorMessage}
              {...(error?.correlationId
                ? { correlationId: error.correlationId }
                : {})}
            />
          )}
          <div className="company-form-grid">
            <Field
              label="Nombre completo"
              value={form.displayName}
              onChange={(displayName) => setForm({ ...form, displayName })}
              required
            />
            <Field
              label="Correo corporativo"
              type="email"
              value={form.email}
              onChange={(email) => setForm({ ...form, email })}
              required
            />
            <Field
              label="Nombre de usuario (opcional)"
              value={form.username}
              onChange={(username) => setForm({ ...form, username })}
              full
            />
          </div>
          <section className="company-locked-role">
            <LockKeyhole aria-hidden="true" />
            <div>
              <strong>Administrador de empresa</strong>
              <p>Rol inicial asignado por el flujo de plataforma.</p>
            </div>
            <span>No editable</span>
          </section>
          <AdminInvitationList
            invitations={invitations}
            loading={invitationsLoading}
            unavailable={invitationsUnavailable}
          />
          <footer className="company-form-actions">
            <button
              type="button"
              className="company-button company-button--secondary"
              onClick={onBack}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="company-button company-button--primary"
              disabled={busy}
            >
              <Mail aria-hidden="true" />
              {busy ? "Enviando…" : "Enviar invitación"}
            </button>
          </footer>
        </form>
        <aside className="company-summary">
          <h2>Empresa creada</h2>
          <dl>
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
              <dd>Activa</dd>
            </div>
          </dl>
        </aside>
      </div>
    </>
  );
}
function Field({
  label,
  value,
  onChange,
  required = false,
  full = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  full?: boolean;
  type?: string;
}) {
  const id = `admin-${label.replaceAll(" ", "-").toLowerCase()}`;
  return (
    <label
      className={full ? "company-form-grid__full" : undefined}
      htmlFor={id}
    >
      {label}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
