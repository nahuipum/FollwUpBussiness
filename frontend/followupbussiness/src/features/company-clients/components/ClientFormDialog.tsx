import { MapPin, Search } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { ConfirmationDialog } from "../../../shared/ui/ConfirmationDialog";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import { OperationDialog } from "../../../shared/ui/OperationDialog";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import { ClientLocationMap } from "./ClientLocationMap";
import type { Client, ClientDuplicateCheckInput, ClientFormInput, ClientFormTarget, TerritoryOption } from "../types";

type Props = {
  client: ClientFormTarget | null;
  territories: readonly TerritoryOption[] | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  duplicates: readonly Client[] | null;
  onClose: () => void;
  onRetry: () => void;
  onSubmit: (input: ClientFormInput) => void;
  onDuplicateCheck: (input: ClientDuplicateCheckInput) => void;
  onDismissError: () => void;
  onDismissDuplicates: () => void;
};

function coordinate(value: string, minimum: number, maximum: number) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

export function ClientFormDialog({
  client,
  territories,
  loading,
  busy,
  error,
  duplicates,
  onClose,
  onRetry,
  onSubmit,
  onDuplicateCheck,
  onDismissError,
  onDismissDuplicates,
}: Props) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(client?.name ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [documentType, setDocumentType] = useState(client?.documentType ?? "");
  const [documentNumber, setDocumentNumber] = useState(client?.documentNumber ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [segment, setSegment] = useState(client?.segment ?? "");
  const [visitFrequencyDays, setVisitFrequencyDays] = useState(client?.visitFrequencyDays?.toString() ?? "");
  const [territoryId, setTerritoryId] = useState(client?.territoryId ?? "");
  const [latitude, setLatitude] = useState(String(client?.location.latitude ?? ""));
  const [longitude, setLongitude] = useState(String(client?.location.longitude ?? ""));
  const [dirty, setDirty] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [discardPending, setDiscardPending] = useState(false);
  const editing = client !== null;
  const latitudeValue = coordinate(latitude, -90, 90);
  const longitudeValue = coordinate(longitude, -180, 180);
  const validLocation = latitudeValue !== null && longitudeValue !== null;
  const frequencyValue = visitFrequencyDays.trim() ? Number(visitFrequencyDays) : null;
  const validFrequency = frequencyValue === null || (Number.isInteger(frequencyValue) && frequencyValue >= 1 && frequencyValue <= 365);
  const documentLengths: Record<string, number> = { DNI: 8, RUC: 11, CE: 9 };
  const hasDocument = documentType !== "" || documentNumber !== "";
  const validDocument = !hasDocument || (documentType !== "" && documentNumber.length === documentLengths[documentType] && /^\d+$/.test(documentNumber));
  const validPhone = !phone || /^9\d{8}$/.test(phone);
  const validEmail = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const optionalFieldsValid = validDocument && validPhone && validEmail;
  const validRequiredFields = name.trim().length >= 2 && address.trim().length >= 3;
  const duplicateCheckAvailable = !busy && validRequiredFields && validFrequency && optionalFieldsValid && validLocation && confirmed;
  const documentError = hasDocument && !validDocument ? documentType ? `El número debe contener exactamente ${documentLengths[documentType]} dígitos.` : "Selecciona un tipo de documento para el número ingresado." : null;

  const dismiss = () => {
    if (busy) return;
    if (dirty) setDiscardPending(true);
    else onClose();
  };
  const change = (set: (value: string) => void, location = false) => (value: string) => {
    setDirty(true);
    if (location) setConfirmed(false);
    set(value);
  };
  const selectPoint = (point: { latitude: number; longitude: number }) => {
    setDirty(true);
    setConfirmed(false);
    setLatitude(String(point.latitude));
    setLongitude(String(point.longitude));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!confirmed || latitudeValue === null || longitudeValue === null || !validFrequency || !optionalFieldsValid) return;
    onSubmit({ name, address, documentType, documentNumber, phone, email, segment, visitFrequencyDays: frequencyValue, territoryId: territoryId || null, latitude: latitudeValue, longitude: longitudeValue });
  };
  const checkDuplicates = () => {
    if (!duplicateCheckAvailable || latitudeValue === null || longitudeValue === null) return;
    onDuplicateCheck({ name, documentNumber, phone, address, latitude: latitudeValue, longitude: longitudeValue, excludeCustomerId: client?.id ?? null });
  };

  if (discardPending) {
    return <ConfirmationDialog titleId="client-discard-title" title="Descartar cambios" message="Tienes cambios sin guardar. Si sales ahora, se perderán los datos y la ubicación seleccionada." cancelLabel="Continuar editando" confirmLabel="Descartar cambios" onCancel={() => setDiscardPending(false)} onConfirm={onClose} />;
  }
  if (error) {
    const loadFailure = territories === null;
    return <OperationDialog titleId="client-error-title" tone="error" title={loadFailure ? "No pudimos cargar el formulario" : "No pudimos completar la operación"} message={error} onClose={onDismissError} primaryLabel={loadFailure ? "Reintentar" : "Volver al formulario"} onPrimary={loadFailure ? () => { onDismissError(); onRetry(); } : onDismissError} {...(loadFailure ? { secondaryLabel: "Cerrar", onSecondary: onClose } : {})} />;
  }
  if (duplicates !== null) {
    const found = duplicates.length > 0;
    return <OperationDialog titleId="client-duplicates-title" tone={found ? "warning" : "info"} title={found ? "Posibles clientes duplicados" : "Sin coincidencias visibles"} message={found ? "Encontramos clientes con un nombre similar. Revisa la información antes de guardar; esta advertencia no bloquea la creación." : "No encontramos coincidencias en esta comprobación informativa. Backend volverá a validar al guardar."} onClose={onDismissDuplicates} primaryLabel="Volver al formulario" />;
  }
  if (!loading && !territories) {
    return <OperationDialog titleId="client-options-title" tone="error" title="No pudimos cargar el formulario" message="No pudimos cargar los territorios activos." onClose={onClose} primaryLabel="Reintentar" onPrimary={onRetry} secondaryLabel="Cerrar" onSecondary={onClose} />;
  }

  return (
    <ModalSurface titleId="client-form-title" onDismiss={dismiss} className="client-form" initialFocusRef={nameRef} dismissOnEscape={false}>
      <ModalHeader
        module="Clientes"
        title={editing ? "Editar cliente" : "Crear cliente"}
        titleId="client-form-title"
        onClose={dismiss}
        closeLabel="Cerrar formulario"
        closeDisabled={busy}
        className="client-form__header"
      />
      {loading ? (
        <div className="client-form__loading" role="status">Cargando territorios activos…</div>
      ) : (
        <form onSubmit={submit}>
          <section className="client-form__section" aria-labelledby="client-general-title">
            <div className="client-form__section-heading"><h3 id="client-general-title">Información del cliente</h3><p>Completa los datos principales.</p></div>
            <label>Nombre<input ref={nameRef} required minLength={2} maxLength={200} value={name} onChange={(event) => change(setName)(event.target.value)} /></label>
            <label>Dirección<input required minLength={3} maxLength={300} value={address} aria-describedby="client-address-hint" onChange={(event) => change(setAddress)(event.target.value)} /></label>
            <p id="client-address-hint" className="client-form__hint">La búsqueda por dirección no está disponible en este MVP. Selecciona el punto en el mapa o ingresa las coordenadas.</p>
            <div className="client-form__optional-fields">
              <div className="client-form__document-fields">
                <label><span>Tipo de documento</span><VisualSelect ariaLabel="Tipo de documento" value={documentType || "NONE"} options={[{ value: "NONE", label: "Sin documento" }, { value: "DNI", label: "DNI" }, { value: "RUC", label: "RUC" }, { value: "CE", label: "Carné de Extranjería" }]} onChange={(value) => { setDirty(true); setDocumentType(value === "NONE" ? "" : value); setDocumentNumber(""); }} disabled={busy} invalid={Boolean(documentError)} /></label>
                <label>Número de documento<input disabled={!documentType || busy} maxLength={documentType ? documentLengths[documentType] : 0} pattern="[0-9]*" inputMode="numeric" value={documentNumber} aria-invalid={Boolean(documentError)} aria-describedby={documentError ? "client-document-error" : undefined} onChange={(event) => change(setDocumentNumber)(event.target.value.replace(/\D/g, ""))} /></label>
                {documentError && <p id="client-document-error" className="client-form__field-error client-form__document-error" role="alert">{documentError}</p>}
              </div>
              <div className="client-form__validated-field">
                <label>Teléfono<input type="tel" maxLength={9} pattern="9[0-9]{8}" inputMode="numeric" value={phone} aria-invalid={!validPhone} aria-describedby={!validPhone ? "client-phone-error" : undefined} onChange={(event) => change(setPhone)(event.target.value.replace(/\D/g, ""))} /></label>
                {!validPhone && <p id="client-phone-error" className="client-form__field-error" role="alert">Ingresa un móvil peruano de 9 dígitos que comience con 9.</p>}
              </div>
              <div className="client-form__validated-field">
                <label>Email<input type="email" maxLength={254} inputMode="email" value={email} aria-invalid={!validEmail} aria-describedby={!validEmail ? "client-email-error" : undefined} onChange={(event) => change(setEmail)(event.target.value)} /></label>
                {!validEmail && <p id="client-email-error" className="client-form__field-error" role="alert">Ingresa un email válido o deja el campo vacío.</p>}
              </div>
              <label>Segmento<input maxLength={80} value={segment} onChange={(event) => change(setSegment)(event.target.value)} /></label>
              <label>Frecuencia de visita (días)<input type="number" min={1} max={365} step={1} inputMode="numeric" value={visitFrequencyDays} onChange={(event) => change(setVisitFrequencyDays)(event.target.value)} /></label>
            </div>
            <label><span>Territorio activo</span><VisualSelect ariaLabel="Territorio activo" value={territoryId || "NONE"} options={[{ value: "NONE", label: "Sin asignar" }, ...(territories ?? []).map((territory) => ({ value: territory.id, label: territory.code ? `${territory.code} — ${territory.name}` : territory.name }))]} onChange={(value) => change(setTerritoryId)(value === "NONE" ? "" : value)} disabled={busy} /></label>
          </section>
          <section className="client-form__section client-form__location" aria-labelledby="client-location-title">
            <div className="client-form__section-heading"><span className="client-form__section-icon"><MapPin aria-hidden="true" /></span><div><h3 id="client-location-title">Ubicación</h3><p>Lima es solo el punto visual inicial; confirma siempre la ubicación real.</p></div></div>
            <div className="client-form__coordinates">
              <label>Latitud<input required type="number" step="any" min={-90} max={90} inputMode="decimal" value={latitude} onChange={(event) => change(setLatitude, true)(event.target.value)} /></label>
              <label>Longitud<input required type="number" step="any" min={-180} max={180} inputMode="decimal" value={longitude} onChange={(event) => change(setLongitude, true)(event.target.value)} /></label>
            </div>
            <p className="client-form__hint">WGS 84: latitud entre -90 y 90, longitud entre -180 y 180.</p>
            <label className="client-form__confirmation"><input type="checkbox" checked={confirmed} disabled={!validLocation || busy} onChange={(event) => setConfirmed(event.target.checked)} /><span>Confirmo que estas coordenadas representan la ubicación del cliente.</span></label>
            <ClientLocationMap latitude={latitudeValue} longitude={longitudeValue} onConfirm={selectPoint} />
          </section>
          <section className="client-form__duplicate-check" aria-labelledby="client-duplicate-check-title">
            <div><h3 id="client-duplicate-check-title">Comprobación de duplicados</h3><p>Es una advertencia informativa y no es necesaria para crear o guardar el cliente.</p></div>
            <button className="client-form__secondary client-form__duplicate" type="button" onClick={checkDuplicates} disabled={!duplicateCheckAvailable}><Search aria-hidden="true" />Comprobar duplicados</button>
          </section>
          <footer>
            <button className="client-form__secondary" type="button" onClick={dismiss} disabled={busy}>Cancelar</button>
            <button className="client-form__primary" type="submit" disabled={busy || !confirmed || !validLocation || !validFrequency || !optionalFieldsValid}>{busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear cliente"}</button>
          </footer>
        </form>
      )}
    </ModalSurface>
  );
}
