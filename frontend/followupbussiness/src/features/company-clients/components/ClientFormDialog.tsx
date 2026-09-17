import { MapPin, Search, UserRound } from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ConfirmationDialog } from "../../../shared/ui/ConfirmationDialog";
import { DrawerSurface } from "../../../shared/ui/DrawerSurface";
import { InlineAlert } from "../../../shared/ui/error-ui/components";
import { ModalAsyncState } from "../../../shared/ui/ModalAsyncState";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import { ClientLocationMap } from "./ClientLocationMap";
import type { Client, ClientDuplicateCheckInput, ClientFormInput, ClientFormTarget, TerritoryOption } from "../types";

type Props = { client: ClientFormTarget | null; territories: readonly TerritoryOption[] | null; loading: boolean; busy: boolean; error: string | null; duplicates: readonly Client[] | null; onClose: () => void; onRetry: () => void; onSubmit: (input: ClientFormInput) => void; onDuplicateCheck: (input: ClientDuplicateCheckInput) => void; onDismissError: () => void; onDismissDuplicates: () => void };

function coordinate(value: string, minimum: number, maximum: number) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

export function ClientFormDialog({ client, territories, loading, busy, error, duplicates, onClose, onRetry, onSubmit, onDuplicateCheck, onDismissError, onDismissDuplicates }: Props) {
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
  const loadFailure = !loading && territories === null;

  const dismiss = () => { if (busy) return; if (dirty) setDiscardPending(true); else onClose(); };
  const change = (set: (value: string) => void, location = false) => (value: string) => { setDirty(true); if (location) setConfirmed(false); set(value); };
  const selectPoint = (point: { latitude: number; longitude: number }) => { setDirty(true); setConfirmed(false); setLatitude(String(point.latitude)); setLongitude(String(point.longitude)); };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!confirmed || latitudeValue === null || longitudeValue === null || !validFrequency || !optionalFieldsValid) return; onSubmit({ name, address, documentType, documentNumber, phone, email, segment, visitFrequencyDays: frequencyValue, territoryId: territoryId || null, latitude: latitudeValue, longitude: longitudeValue }); };
  const checkDuplicates = () => { if (!duplicateCheckAvailable || latitudeValue === null || longitudeValue === null) return; onDuplicateCheck({ name, documentNumber, phone, address, latitude: latitudeValue, longitude: longitudeValue, excludeCustomerId: client?.id ?? null }); };

  if (discardPending) return <ConfirmationDialog appearance="golden" module="Clientes" titleId="client-discard-title" title="Descartar cambios" headerDescription="Confirma antes de cerrar el formulario." message="Tienes cambios sin guardar. Si sales ahora, se perderán los datos y la ubicación seleccionada." cancelLabel="Continuar editando" confirmLabel="Descartar cambios" onCancel={() => setDiscardPending(false)} onConfirm={onClose} />;

  const footer = !loading && !loadFailure ? <><button className="client-form__secondary" type="button" onClick={dismiss} disabled={busy}>Cancelar</button><button className="client-form__primary" type="submit" form="client-form" disabled={busy || !confirmed || !validLocation || !validFrequency || !optionalFieldsValid}>{busy ? <><span className="client-form__spinner" aria-hidden="true" />Guardando…</> : editing ? "Guardar cambios" : "Crear cliente"}</button></> : undefined;

  return <DrawerSurface titleId="client-form-title" descriptionId="client-form-description" onDismiss={dismiss} busy={busy} dismissOnEscape={false} initialFocusRef={nameRef} className="client-form" header={<ModalHeader module="Clientes" title={editing ? "Editar cliente" : "Crear cliente"} titleId="client-form-title" descriptionId="client-form-description" description="Completa los datos y confirma la ubicación real del cliente." onClose={dismiss} closeLabel="Cerrar formulario" closeDisabled={busy} />} footer={footer}>
    {loading ? <ModalAsyncState state="loading" title={editing ? "Cargando cliente y territorios" : "Cargando territorios activos"} message="Estamos preparando el formulario con la información vigente." />
      : loadFailure ? <ModalAsyncState state="error" title="No pudimos cargar los territorios" message={error ?? "No es posible preparar el formulario sin consultar los territorios activos."} primaryAction={{ label: "Reintentar", onClick: () => { onDismissError(); onRetry(); } }} secondaryAction={{ label: "Cerrar", onClick: onClose }} />
      : <form id="client-form" className="client-form__body" onSubmit={submit}>
        {error && <InlineAlert className="client-form__alert" variant="error" title={error.includes("cambiaron") ? "El cliente cambió mientras editabas" : "No pudimos completar la operación"} message={error} action={{ label: "Cerrar aviso", onClick: onDismissError }} />}
        <section className="client-form__section" aria-labelledby="client-general-title">
          <SectionHeading icon={<UserRound aria-hidden="true" />} titleId="client-general-title" title="Información del cliente" description="Los campos de contacto y clasificación son opcionales salvo que se indique lo contrario." />
          <Field label="Nombre"><input ref={nameRef} aria-label="Nombre" required minLength={2} maxLength={200} value={name} onChange={(event) => change(setName)(event.target.value)} disabled={busy} /></Field>
          <Field label="Dirección" help="La búsqueda automática de dirección no está disponible. Ubica y confirma el punto real."><input aria-label="Dirección" required minLength={3} maxLength={300} value={address} onChange={(event) => change(setAddress)(event.target.value)} disabled={busy} /></Field>
          <div className="client-form__grid client-form__grid--three">
            <Field label="Tipo de documento"><VisualSelect variant="golden" ariaLabel="Tipo de documento" value={documentType || "NONE"} options={[{ value: "NONE", label: "Sin documento" }, { value: "DNI", label: "DNI" }, { value: "RUC", label: "RUC" }, { value: "CE", label: "Carné de Extranjería" }]} onChange={(value) => { setDirty(true); setDocumentType(value === "NONE" ? "" : value); setDocumentNumber(""); }} disabled={busy} invalid={Boolean(documentError)} /></Field>
            <Field label="Número de documento" error={documentError}><input aria-label="Número de documento" disabled={!documentType || busy} maxLength={documentType ? documentLengths[documentType] : 0} pattern="[0-9]*" inputMode="numeric" value={documentNumber} aria-invalid={Boolean(documentError)} onChange={(event) => change(setDocumentNumber)(event.target.value.replace(/\D/g, ""))} /></Field>
            <Field label="Teléfono" error={!validPhone ? "Ingresa un móvil peruano válido de 9 dígitos." : null}><input aria-label="Teléfono" type="tel" maxLength={9} inputMode="numeric" value={phone} aria-invalid={!validPhone} onChange={(event) => change(setPhone)(event.target.value.replace(/\D/g, ""))} disabled={busy} /></Field>
          </div>
          <div className="client-form__grid"><Field label="Email" error={!validEmail ? "Ingresa un email válido o deja el campo vacío." : null}><input aria-label="Email" type="email" maxLength={254} value={email} aria-invalid={!validEmail} onChange={(event) => change(setEmail)(event.target.value)} disabled={busy} /></Field><Field label="Segmento"><input aria-label="Segmento" maxLength={80} value={segment} onChange={(event) => change(setSegment)(event.target.value)} disabled={busy} /></Field></div>
          <div className="client-form__grid"><Field label="Frecuencia de visita en días" error={!validFrequency ? "Ingresa un número entero entre 1 y 365." : null}><input aria-label="Frecuencia de visita en días" type="number" min={1} max={365} step={1} value={visitFrequencyDays} aria-invalid={!validFrequency} onChange={(event) => change(setVisitFrequencyDays)(event.target.value)} disabled={busy} /></Field><Field label="Territorio activo" help="Solo se muestran territorios activos; también puedes dejarlo sin asignar."><VisualSelect variant="golden" ariaLabel="Territorio activo" value={territoryId || "NONE"} options={[{ value: "NONE", label: "Sin territorio" }, ...(territories ?? []).map((territory) => ({ value: territory.id, label: territory.code ? `${territory.code} — ${territory.name}` : territory.name }))]} onChange={(value) => change(setTerritoryId)(value === "NONE" ? "" : value)} disabled={busy} /></Field></div>
        </section>
        <section className="client-form__section client-form__location" aria-labelledby="client-location-title">
          <SectionHeading icon={<MapPin aria-hidden="true" />} titleId="client-location-title" title="Ubicación" description="Lima es solo el punto visual inicial; confirma siempre la ubicación real." />
          <div className="client-form__grid"><Field label="Latitud" help="Valor entre -90 y 90." error={latitude && latitudeValue === null ? "Ingresa una latitud válida entre -90 y 90." : null}><input aria-label="Latitud" required type="number" step="any" min={-90} max={90} value={latitude} aria-invalid={latitude !== "" && latitudeValue === null} onChange={(event) => change(setLatitude, true)(event.target.value)} disabled={busy} /></Field><Field label="Longitud" help="Valor entre -180 y 180." error={longitude && longitudeValue === null ? "Ingresa una longitud válida entre -180 y 180." : null}><input aria-label="Longitud" required type="number" step="any" min={-180} max={180} value={longitude} aria-invalid={longitude !== "" && longitudeValue === null} onChange={(event) => change(setLongitude, true)(event.target.value)} disabled={busy} /></Field></div>
          <label className={`client-form__confirmation${validLocation && !confirmed ? " client-form__confirmation--pending" : ""}`}><input type="checkbox" checked={confirmed} disabled={!validLocation || busy} onChange={(event) => setConfirmed(event.target.checked)} /><span>Confirmo que estas coordenadas representan la ubicación real del cliente.</span></label>
          <ClientLocationMap latitude={latitudeValue} longitude={longitudeValue} onConfirm={selectPoint} />
        </section>
        <section className="client-form__section client-form__duplicate-check" aria-labelledby="client-duplicate-check-title">
          <SectionHeading icon={<Search aria-hidden="true" />} titleId="client-duplicate-check-title" title="Comprobación de duplicados" description="La comprobación es informativa y no reemplaza la validación del servidor al guardar." />
          {duplicates !== null && (duplicates.length ? <><InlineAlert className="client-form__alert" variant="warning" title="Encontramos posibles duplicados" message="Revisa las coincidencias antes de continuar. La advertencia no bloquea el guardado." action={{ label: "Cerrar aviso", onClick: onDismissDuplicates }} /><ul className="client-form__duplicates">{duplicates.map((duplicate) => <li key={duplicate.id}><span><strong>{duplicate.name}</strong><small>{duplicate.segment ?? "Segmento no informado"}</small></span><span>Posible coincidencia</span></li>)}</ul></> : <div className="client-form__duplicate-empty" role="status"><strong>Sin coincidencias visibles</strong><p>No encontramos coincidencias en esta comprobación informativa. El servidor volverá a validar al guardar.</p><button type="button" onClick={onDismissDuplicates}>Cerrar aviso</button></div>)}
          <button className="client-form__secondary client-form__duplicate" type="button" onClick={checkDuplicates} disabled={!duplicateCheckAvailable}><Search aria-hidden="true" />Comprobar duplicados</button>
        </section>
      </form>}
  </DrawerSurface>;
}

function SectionHeading({ icon, titleId, title, description }: { icon: ReactNode; titleId: string; title: string; description: string }) { return <div className="client-form__section-heading"><span className="client-form__section-icon">{icon}</span><div><h3 id={titleId}>{title}</h3><p>{description}</p></div></div>; }
function Field({ label, help, error, children }: { label: string; help?: string; error?: string | null; children: ReactNode }) { return <label className="client-form__field"><span>{label}</span>{children}{help && <small>{help}</small>}{error && <small className="client-form__field-error" role="alert">{error}</small>}</label>; }
