import { useMemo, useRef, useState, type FormEvent } from "react";
import type { ApiError } from "../../../lib/api";
import { Button } from "../../../shared/ui/Button";
import { DateFilterField } from "../../../shared/ui/DateFilterField";
import { DrawerSurface } from "../../../shared/ui/DrawerSurface";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import { InlineAlert } from "../../../shared/ui/error-ui/components";
import { formatRouteDate, routeLabel } from "../route-label";
import type { CopyRouteInput, Route, RouteSellerOption } from "../types";

export function RouteCopyDialog({ source, sellers, busy, error, onSubmit, onClose }: { source: Route; sellers: readonly RouteSellerOption[]; busy: boolean; error: ApiError | null; onSubmit: (input: CopyRouteInput) => void; onClose: () => void }) {
  const activeSellers = useMemo(() => sellers.filter((seller) => seller.status === "ACTIVE"), [sellers]);
  const defaultSeller = activeSellers.some((seller) => seller.id === source.sellerId) ? source.sellerId : activeSellers[0]?.id ?? "";
  const [date, setDate] = useState("");
  const [sellerId, setSellerId] = useState(defaultSeller);
  const [name, setName] = useState(source.name ?? "");
  const closeRef = useRef<HTMLButtonElement>(null);
  const valid = Boolean(date && sellerId && name.trim().length <= 160);
  const errorMessage = error?.status === 403 ? "No tienes permiso para copiar esta ruta o el vendedor quedó fuera de tu alcance." : error?.status === 409 ? "La ruta o el destino cambió. Actualiza las rutas antes de volver a intentarlo." : error?.status === 422 ? "Revisa que la fecha sea futura y que el vendedor esté activo." : "No pudimos copiar la ruta. Puedes volver a intentarlo sin cerrar este diálogo.";
  const sellerOptions = [{ value: "", label: "Selecciona un vendedor activo" }, ...activeSellers.map((seller) => ({ value: seller.id, label: seller.label }))];
  const submit = (event: FormEvent) => { event.preventDefault(); if (valid && !busy) onSubmit({ date, sellerId, ...(name.trim() ? { name: name.trim() } : {}) }); };
  return <DrawerSurface titleId="route-copy-title" descriptionId="route-copy-description" onDismiss={onClose} busy={busy} initialFocusRef={closeRef} className="route-copy-drawer"
    header={<ModalHeader module="Rutas" title="Copiar ruta" titleId="route-copy-title" descriptionId="route-copy-description" description="Crea un nuevo borrador sin modificar la ruta original." onClose={onClose} closeLabel="Cerrar formulario" closeDisabled={busy} closeRef={closeRef} />}
    footer={<><Button onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" form="route-copy-form" variant="primary" disabled={!valid || busy}>{busy ? "Copiando…" : "Crear copia"}</Button></>}>
    <form id="route-copy-form" className="route-copy-form" onSubmit={submit}>
      <InlineAlert variant="info" className="route-copy-form__context" title={routeLabel(source)} message={`${formatRouteDate(source.date)} · ${source.points.length} visitas. La copia puede omitir puntos que ya no sean válidos para el vendedor destino.`} />
      {error && <InlineAlert variant="error" title="No se creó la copia" message={errorMessage} {...(error.correlationId ? { correlationId: error.correlationId } : {})} />}
      <DateFilterField label="Fecha nueva" value={date} onValueChange={setDate} disabled={busy} required variant="golden" />
      <label>Vendedor<VisualSelect variant="golden" ariaLabel="Vendedor" value={sellerId} options={sellerOptions} onChange={setSellerId} disabled={busy} invalid={!sellerId} /></label>
      <label>Nombre <span>Opcional</span><input type="text" maxLength={160} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} aria-describedby="route-copy-name-help" /><small id="route-copy-name-help">Máximo 160 caracteres. {name.length}/160</small></label>
    </form>
  </DrawerSurface>;
}
