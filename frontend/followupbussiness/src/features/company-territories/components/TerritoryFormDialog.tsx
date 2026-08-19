import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import type { Territory, TerritoryFormInput } from "../types";

export function TerritoryFormDialog({ territory, busy, error, conflict, onClose, onReload, onSubmit }: { territory: Territory | null; busy: boolean; error: string | null; conflict: boolean; onClose: () => void; onReload: () => void; onSubmit: (input: TerritoryFormInput) => void }) {
  const [name, setName] = useState(territory?.name ?? "");
  const [code, setCode] = useState(territory?.code ?? "");
  const [description, setDescription] = useState(territory?.description ?? "");
  const [status, setStatus] = useState(territory?.status ?? "ACTIVE");
  const [pendingInactivation, setPendingInactivation] = useState<TerritoryFormInput | null>(null);
  const editing = territory !== null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const input = { name: name.trim(), code: code.trim(), description: description.trim() || null, status };
    if (territory?.status === "ACTIVE" && input.status === "INACTIVE") {
      setPendingInactivation(input);
      return;
    }
    onSubmit(input);
  };
  if (pendingInactivation) return <ModalSurface titleId="territory-inactivation-title" onDismiss={() => setPendingInactivation(null)} className="territory-list__dialog"><header><h2 id="territory-inactivation-title">Inactivar zona</h2></header><p>La zona dejará de aceptar nuevas asignaciones. No se eliminará ni se alterarán las referencias históricas.</p><footer><button className="territory-list__secondary" type="button" autoFocus onClick={() => setPendingInactivation(null)}>Cancelar</button><button className="territory-list__primary" type="button" onClick={() => onSubmit(pendingInactivation)} disabled={busy}>{busy ? "Guardando…" : "Confirmar inactivación"}</button></footer></ModalSurface>;
  return <ModalSurface titleId="territory-form-title" onDismiss={onClose} className={`territory-list__dialog territory-list__form-dialog${editing ? " territory-list__form-dialog--editing" : ""}`}><header><h2 id="territory-form-title">{editing ? "Editar zona" : "Crear zona"}</h2><button type="button" aria-label="Cerrar formulario" onClick={onClose} disabled={busy}><X aria-hidden="true" /></button></header><form onSubmit={submit}><label>Nombre de zona<input autoFocus required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} /></label><label>Código<input maxLength={40} value={code} onChange={(event) => setCode(event.target.value)} disabled={busy} /></label><label>Descripción<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} /></label>{editing && <label>Estado<VisualSelect ariaLabel="Estado" value={status} options={[{ value: "ACTIVE", label: "Activa" }, { value: "INACTIVE", label: "Inactiva" }]} onChange={setStatus} disabled={busy} /></label>}{error && <div role="alert"><p>{error}</p>{conflict && <button className="territory-list__secondary" type="button" onClick={onReload} disabled={busy}>Recargar listado y conservar formulario</button>}</div>}<footer><button className="territory-list__secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button><button className="territory-list__primary" type="submit" disabled={busy}>{busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear zona"}</button></footer></form></ModalSurface>;
}
