import { ShieldCheck, UserRound, X } from "lucide-react";
import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { CompanyUser, CompanyUserInput, CompanyUserRole } from "../types";

export function CompanyUserInviteDialog({
  user,
  mode,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  user: CompanyUser | null;
  mode: "invite" | "edit" | "resend";
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: CompanyUserInput) => void;
}) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [role, setRole] = useState<CompanyUserRole>(user?.role ?? "SUPERVISOR");
  const close = () => {
    if (!busy) onClose();
  };
  const editing = mode === "edit";
  const resending = mode === "resend";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!busy)
      onSubmit({
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        ...(username.trim() ? { username: username.trim() } : {}),
      });
  };
  const title = resending
    ? "Corregir y reenviar invitación"
    : editing
      ? "Editar usuario"
      : "Invitar usuario";
  const submitLabel = resending
    ? "Corregir y reenviar invitación"
    : editing
      ? "Guardar cambios"
      : "Enviar invitación";
  return (
    <ModalSurface titleId="invite-title" onDismiss={close} className="company-users__dialog">
        <header>
          <h2 id="invite-title">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar invitación"
            onClick={close}
            disabled={busy}
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <form onSubmit={submit}>
          <label>
            Nombre completo
            <input
              required
              minLength={2}
              maxLength={160}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Ingresa el nombre completo"
            />
          </label>
          <label>
            Correo corporativo
            <input
              required
              type="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ej. nombre@empresa.pe"
            />
          </label>
          <label>
            Usuario (opcional)
            <input
              minLength={3}
              maxLength={100}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <fieldset className="company-users__role-picker">
            <legend>Rol</legend>
            <div
              role="radiogroup"
              aria-label="Selecciona un rol"
              className="company-users__role-options"
            >
              <RoleOption
                role="COMPANY_ADMIN"
                label="Administrador"
                description="Gestiona usuarios de la empresa"
                icon={<ShieldCheck aria-hidden="true" />}
                selected={role === "COMPANY_ADMIN"}
                onSelect={setRole}
              />
              <RoleOption
                role="SUPERVISOR"
                label="Supervisor"
                description="Acceso a la gestión operativa y reportes de su equipo"
                icon={<UserRound aria-hidden="true" />}
                selected={role === "SUPERVISOR"}
                onSelect={setRole}
              />
            </div>
          </fieldset>
          {error && <p role="alert">{error}</p>}
          <footer>
            <button
              className="company-users__secondary"
              type="button"
              onClick={close}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              className="company-users__primary"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Guardando…"
                : submitLabel}
            </button>
          </footer>
        </form>
    </ModalSurface>
  );
}

function RoleOption({
  role,
  label,
  description,
  icon,
  selected,
  onSelect,
}: {
  role: CompanyUserRole;
  label: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: (role: CompanyUserRole) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`company-users__role-option${selected ? " company-users__role-option--selected" : ""}`}
      onClick={() => onSelect(role)}
    >
      <>{icon}</>
      <strong>{label}</strong>
      <span>{description}</span>
    </button>
  );
}
