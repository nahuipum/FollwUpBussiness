import { useRef, useState, type FormEvent } from "react";
import { DrawerSurface } from "../../../shared/ui/DrawerSurface";
import { ModalAsyncState } from "../../../shared/ui/ModalAsyncState";
import { MultiSelect } from "../../../shared/ui/MultiSelect";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import { DrawerHeader } from "./SellerDetailDialog";
import type { Seller, SellerFormInput, SellerFormOptions } from "../types";

type Props = {
  seller: Seller | null;
  options: SellerFormOptions | null;
  loadingOptions: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: SellerFormInput) => void;
  onRetryOptions: () => void;
};

export function SellerFormDialog({ seller, options, loadingOptions, busy, error, onClose, onSubmit, onRetryOptions }: Props) {
  const [displayName, setDisplayName] = useState(seller?.displayName ?? "");
  const [email, setEmail] = useState(seller?.email ?? "");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState(seller?.phone ?? "");
  const [employeeCode, setEmployeeCode] = useState(seller?.employeeCode ?? "");
  const [supervisorId, setSupervisorId] = useState<string | null>(seller?.supervisorId ?? null);
  const [territoryIds, setTerritoryIds] = useState<readonly string[]>(seller?.territoryIds ?? []);
  const nameRef = useRef<HTMLInputElement>(null);
  const editing = seller !== null;
  const title = editing ? "Editar vendedor" : "Crear vendedor";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy || !options) return;
    onSubmit({ displayName: displayName.trim(), email: email.trim(), username: username.trim(), phone: phone.trim(), employeeCode: employeeCode.trim(), supervisorId, territoryIds: [...new Set(territoryIds)] });
  };

  return <DrawerSurface titleId="seller-form-title" descriptionId="seller-form-description" busy={busy} onDismiss={onClose} initialFocusRef={nameRef} className="seller-list__drawer" header={<DrawerHeader titleId="seller-form-title" descriptionId="seller-form-description" title={title} description={editing ? "Actualiza únicamente los datos permitidos del perfil." : "Configura el perfil e invitación del vendedor."} onClose={onClose} busy={busy} />} footer={<><button className="seller-list__secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button><button className="seller-list__primary" type="submit" form="seller-form" disabled={busy}>{busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear vendedor"}</button></>}>
    {loadingOptions && <ModalAsyncState state="loading" title="Cargando opciones" message="Estamos preparando los datos necesarios para el formulario." />}
    {!loadingOptions && !options && <ModalAsyncState state="error" title="No pudimos cargar las opciones de asignación." message="No logramos obtener los datos necesarios. Reintenta en unos segundos." primaryAction={{ label: "Reintentar", onClick: onRetryOptions }} secondaryAction={{ label: "Cerrar", onClick: onClose }} />}
    {options && <form id="seller-form" className="seller-list__form" onSubmit={submit}>
      {error && <div className="seller-list__form-error" role="alert"><p>{error}</p></div>}
      <label>Nombre completo<input ref={nameRef} required minLength={2} maxLength={160} value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={busy} /></label>
      <label>Correo corporativo<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={editing || busy} /></label>
      {!editing && <label>Usuario <span>(opcional)</span><input minLength={3} maxLength={100} value={username} onChange={(event) => setUsername(event.target.value)} disabled={busy} /></label>}
      <label>Teléfono <span>(opcional)</span><input maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} disabled={busy} /></label>
      <label>Código de vendedor <span>(opcional)</span><input maxLength={50} value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} disabled={busy} /></label>
      {!editing && <><label>Supervisor<VisualSelect variant="golden" ariaLabel="Supervisor" value={supervisorId ?? "NONE"} options={[{ value: "NONE", label: "Sin asignar" }, ...options.supervisors.map((item) => ({ value: item.id, label: item.displayName }))]} onChange={(value) => setSupervisorId(value === "NONE" ? null : value)} disabled={busy} /></label><MultiSelect variant="golden" searchable selectionNoun="territorios" placeholder="Seleccionar territorios" searchPlaceholder="Buscar por código o nombre" emptyMessage="No encontramos territorios activos." selectedSummary={(count) => `${count} territorio${count === 1 ? "" : "s"} seleccionado${count === 1 ? "" : "s"}`} visibleSummary={(count) => `${count} coincidencia${count === 1 ? "" : "s"} visible${count === 1 ? "" : "s"}`} totalSummary={(count) => `${count} territorios disponibles`} label="Territorios" ariaLabel="Territorios" value={territoryIds} options={options.territories.map((item) => ({ value: item.id, label: item.name, meta: item.code, description: "Territorio activo" }))} onChange={setTerritoryIds} /></>}
    </form>}
  </DrawerSurface>;
}
