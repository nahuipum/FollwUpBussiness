import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import { FormAlert } from "../../../shared/ui/FormAlert";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import type { Seller, SellerFormOptions } from "../types";
import type { SellerAssignmentKind } from "../hooks/useSellerAssignment";

export function SellerAssignmentDialog({ seller, kind, options, loading, busy, error, onClose, onRetry, onSubmit }: {
  seller: Seller; kind: SellerAssignmentKind; options: SellerFormOptions | null; loading: boolean; busy: boolean; error: string | null;
  onClose: () => void; onRetry: () => void; onSubmit: (value: string | null | readonly string[]) => void;
}) {
  const [supervisorId, setSupervisorId] = useState<string | null>(seller.supervisorId);
  const [territoryIds, setTerritoryIds] = useState<readonly string[]>(seller.territoryIds);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const supervisor = kind === "supervisor";
  const title = supervisor ? (seller.supervisorId ? "Reasignar supervisor" : "Asignar supervisor") : "Asignar territorios";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!supervisor && territoryIds.length === 0) {
      setSelectionError("Selecciona al menos un territorio para guardar la asignación.");
      return;
    }
    setSelectionError(null);
    onSubmit(supervisor ? supervisorId : [...new Set(territoryIds)]);
  };
  return <ModalSurface titleId="seller-assignment-title" onDismiss={onClose} className={`seller-list__dialog seller-list__form-dialog seller-list__assignment-dialog${supervisor ? " seller-list__assignment-dialog--supervisor" : ""}`}>
    <header><h2 id="seller-assignment-title">{title}</h2><button type="button" aria-label="Cerrar asignación" onClick={onClose} disabled={busy}><X aria-hidden="true" /></button></header>
    <p>Vendedor: <strong>{seller.displayName}</strong></p>
    {loading ? <p role="status">Cargando opciones…</p> : !options ? <div role="alert"><p>No pudimos cargar las opciones.</p><button className="seller-list__secondary" type="button" onClick={onRetry}>Reintentar</button></div> : <form onSubmit={submit}>
      {supervisor ? <label>Supervisor<VisualSelect ariaLabel="Supervisor" value={supervisorId ?? "NONE"} options={[{ value: "NONE", label: "Sin asignar" }, ...options.supervisors.map((item) => ({ value: item.id, label: item.displayName }))]} onChange={(value) => setSupervisorId(value === "NONE" ? null : value)} /></label> : <fieldset><legend>Territorios</legend>{options.territories.map((territory) => <label key={territory.id} className="seller-list__checkbox"><input type="checkbox" checked={territoryIds.includes(territory.id)} onChange={(event) => { setSelectionError(null); setTerritoryIds((current) => event.target.checked ? [...current, territory.id] : current.filter((id) => id !== territory.id)); }} />{territory.code} — {territory.name}</label>)}</fieldset>}
      {(selectionError || error) && <FormAlert>{selectionError ?? error}</FormAlert>}
      <footer><button className="seller-list__secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button><button className="seller-list__primary" type="submit" disabled={busy}>{busy ? "Guardando…" : title}</button></footer>
    </form>}
  </ModalSurface>;
}
