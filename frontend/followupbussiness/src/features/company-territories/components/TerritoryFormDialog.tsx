import { ShieldCheck, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import type { ApiError } from "../../../lib/api";
import { Button } from "../../../shared/ui/Button";
import { ConfirmationDialog } from "../../../shared/ui/ConfirmationDialog";
import { DrawerSurface } from "../../../shared/ui/DrawerSurface";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import { InlineAlert } from "../../../shared/ui/error-ui/components";
import type { Territory, TerritoryFormInput } from "../types";

type Props = { territory: Territory | null; busy: boolean; error: ApiError | null; conflict: boolean; onClose: () => void; onReload: () => void; onSubmit: (input: TerritoryFormInput) => void };

export function TerritoryFormDialog({ territory, busy, error, conflict, onClose, onReload, onSubmit }: Props) {
  const nameRef = useRef<HTMLInputElement>(null);
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

  if (pendingInactivation) return <ConfirmationDialog appearance="golden" module="Zonas" titleId="territory-inactivation-title" descriptionId="territory-inactivation-description" title="Inactivar zona" headerDescription="Confirma el cambio de disponibilidad." identity={<><strong>{territory?.name}</strong><small>{territory?.code || "Sin código"} · {territory?.assignedSellerCount ?? 0} vendedores asignados</small></>} message="La zona dejará de aceptar nuevas asignaciones. No se eliminará ni se desasignarán vendedores o clientes existentes." note={<><ShieldCheck aria-hidden="true" />Las referencias y los registros históricos permanecerán vinculados sin alteraciones.</>} tone="error" busy={busy} busyLabel="Inactivando…" error={error ? errorMessage(error, conflict) : null} correlationId={error?.correlationId} errorTitle="No pudimos inactivar la zona" confirmLabel="Confirmar inactivación" onCancel={() => setPendingInactivation(null)} onConfirm={() => onSubmit(pendingInactivation)} />;

  return <DrawerSurface titleId="territory-form-title" descriptionId="territory-form-description" busy={busy} onDismiss={onClose} initialFocusRef={nameRef} className="territory-list__drawer"
    header={<div className="territory-list__drawer-header"><div><span className="territory-list__eyebrow">Zonas</span><h2 id="territory-form-title">{editing ? "Editar zona" : "Crear zona"}</h2><p id="territory-form-description">{editing ? "Actualiza los datos editables del catálogo comercial." : "Registra una zona para organizar futuras asignaciones."}</p></div><Button iconOnly aria-label="Cerrar formulario" onClick={onClose} disabled={busy}><X aria-hidden="true" /></Button></div>}
    footer={<><Button onClick={onClose} disabled={busy}>Cancelar</Button><Button variant="primary" type="submit" form="territory-form" disabled={busy}>{busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear zona"}</Button></>}>
    <form id="territory-form" className="territory-list__form" onSubmit={submit}>
      {editing && territory && <InlineAlert visual="golden" variant="info" className="territory-list__form-context" title={territory.name} message={`${territory.status === "ACTIVE" ? "Zona activa" : "Zona inactiva"} · ${territory.assignedSellerCount} vendedores asignados · versión consultada ${territory.version}`} />}
      <label>Nombre de zona<input ref={nameRef} required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} placeholder="Ej. Lima Centro" aria-describedby="territory-name-help" /><small id="territory-name-help">Obligatorio · entre 2 y 160 caracteres. {name.length}/160</small></label>
      <label>Código <span>Opcional</span><input maxLength={40} value={code} onChange={(event) => setCode(event.target.value)} disabled={busy} placeholder="Ej. LIM-CEN" aria-describedby="territory-code-help" /><small id="territory-code-help">Máximo 40 caracteres. {code.length}/40</small></label>
      <label>Descripción <span>Opcional</span><textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} placeholder="Describe la cobertura comercial de la zona" aria-describedby="territory-description-help" /><small id="territory-description-help">Máximo 500 caracteres. {description.length}/500</small></label>
      {editing && <label>Estado<VisualSelect variant="golden" ariaLabel="Estado" value={status} options={[{ value: "ACTIVE", label: "Activa" }, { value: "INACTIVE", label: "Inactiva" }]} onChange={setStatus} disabled={busy} /><small>Las zonas inactivas no aceptan asignaciones nuevas.</small></label>}
      {error && <InlineAlert visual="golden" variant={conflict ? "warning" : "error"} className="territory-list__form-error" title={errorTitle(error, conflict)} message={errorMessage(error, conflict)} {...(error.correlationId ? { correlationId: error.correlationId } : {})} {...(conflict ? { action: { label: "Recargar listado y conservar formulario", onClick: onReload, disabled: busy } } : {})} />}
    </form>
  </DrawerSurface>;
}

function errorTitle(error: ApiError, conflict: boolean) {
  if (error.status === 403) return "No tienes permisos";
  if (error.status === 404) return "La zona ya no existe";
  if (conflict) return "Los datos cambiaron";
  if (error.status === 409) return "La zona ya existe";
  if (error.status === 422) return "Revisa la información ingresada";
  return "No pudimos guardar la zona";
}

function errorMessage(error: ApiError, conflict: boolean) { if (error.status === 403) return "No tienes permiso para realizar esta acción."; if (error.status === 404) return "La zona ya no está disponible. Recarga el listado y conserva el formulario."; if (conflict) return "Los datos cambiaron. Recarga el listado y corrige el formulario; lo escrito se conserva."; if (error.status === 409) return "Ya existe una zona con esos datos. Revisa el nombre o código."; if (error.status === 422) return "Revisa la información ingresada e inténtalo nuevamente."; return "No pudimos guardar los cambios. Inténtalo nuevamente."; }
