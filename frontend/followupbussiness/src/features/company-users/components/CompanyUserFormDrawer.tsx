import { ShieldCheck, UserRound, X } from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { DrawerSurface } from "../../../shared/ui/DrawerSurface";
import { CorrelationId } from "../../../shared/ui/error-ui/components/CorrelationId";
import type { CompanyUser, CompanyUserInput, CompanyUserRole } from "../types";

export function CompanyUserFormDrawer({ user, mode, busy, error, correlationId, onClose, onSubmit }: { user: CompanyUser | null; mode: "invite" | "edit" | "resend"; busy: boolean; error: string | null; correlationId?: string | null | undefined; onClose: () => void; onSubmit: (input: CompanyUserInput) => void }) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [role, setRole] = useState<CompanyUserRole>(user?.role ?? "SUPERVISOR");
  const nameRef = useRef<HTMLInputElement>(null);
  const resending = mode === "resend";
  const editing = mode === "edit";
  const title = resending ? "Corregir y reenviar invitación" : editing ? "Editar administrador o supervisor" : "Invitar administrador o supervisor";
  const description = resending ? "Corrige la invitación pendiente antes de solicitar una nueva entrega." : editing ? "Actualiza los datos permitidos de la cuenta." : "Configura el acceso que recibirá la persona invitada.";
  const submitLabel = resending ? "Corregir y reenviar invitación" : editing ? "Guardar cambios" : "Enviar invitación";
  const submit = (event: FormEvent) => { event.preventDefault(); if (!busy) onSubmit({ displayName: displayName.trim(), email: email.trim(), role, ...(username.trim() ? { username: username.trim() } : {}) }); };
  return <DrawerSurface titleId="company-user-form-title" descriptionId="company-user-form-description" busy={busy} onDismiss={onClose} initialFocusRef={nameRef} className="company-users__drawer" header={<div className="company-users__drawer-header"><div><span className="company-users__eyebrow">Usuarios</span><h2 id="company-user-form-title">{title}</h2><p id="company-user-form-description">{description}</p></div><button className="company-users__drawer-close" type="button" aria-label="Cerrar formulario" onClick={onClose} disabled={busy}><X aria-hidden="true" /></button></div>} footer={<><button className="company-users__secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button><button className="company-users__primary" type="submit" form="company-user-form" disabled={busy}>{busy ? "Guardando…" : submitLabel}</button></>}>
    <form id="company-user-form" className="company-users__form" onSubmit={submit}>
      {(editing || resending) && user && <p className="company-users__form-context"><strong>{user.displayName}</strong><span>{resending ? "Invitación pendiente" : "Cuenta activa"} · {user.email}</span></p>}
      {error && <div className="company-users__form-error" role="alert"><p>{error}</p>{correlationId && <CorrelationId correlationId={correlationId} />}</div>}
      <label>Nombre completo<input ref={nameRef} required minLength={2} maxLength={160} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ingresa el nombre completo" disabled={busy} /></label>
      <label>Correo corporativo<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.example" disabled={busy} /></label>
      <label>Usuario <span>(opcional)</span><input minLength={3} maxLength={100} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Ej. mtorres" disabled={busy} /></label>
      <fieldset className="company-users__role-picker"><legend>Rol</legend><div role="radiogroup" aria-label="Selecciona un rol" className="company-users__role-options"><RoleOption role="COMPANY_ADMIN" label="Administrador" description="Gestiona usuarios de la empresa" icon={<ShieldCheck aria-hidden="true" />} selected={role === "COMPANY_ADMIN"} disabled={busy} onSelect={setRole} /><RoleOption role="SUPERVISOR" label="Supervisor" description="Consulta y coordina la operación permitida para su rol." icon={<UserRound aria-hidden="true" />} selected={role === "SUPERVISOR"} disabled={busy} onSelect={setRole} /></div></fieldset>
    </form>
  </DrawerSurface>;
}

function RoleOption({ role, label, description, icon, selected, disabled, onSelect }: { role: CompanyUserRole; label: string; description: string; icon: ReactNode; selected: boolean; disabled: boolean; onSelect: (role: CompanyUserRole) => void }) { return <button type="button" role="radio" aria-checked={selected} disabled={disabled} className={`company-users__role-option${selected ? " company-users__role-option--selected" : ""}`} onClick={() => onSelect(role)}>{icon}<strong>{label}</strong><span>{description}</span></button>; }
