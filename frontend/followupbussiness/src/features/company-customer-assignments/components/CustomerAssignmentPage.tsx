import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AsyncStateCard } from "../../../shared/ui/AsyncStateCard";
import { Button } from "../../../shared/ui/Button";
import { ConfirmationDialog } from "../../../shared/ui/ConfirmationDialog";
import { DataTable, DataTableIdentity, DataTablePagination, type DataTableColumn } from "../../../shared/ui/DataTable";
import { DataTablePanel, DataTableResultsHeader, DataTableToolbar, SearchField } from "../../../shared/ui/DataTableWorkspace";
import { DateFilterField } from "../../../shared/ui/DateFilterField";
import { InlineAlert } from "../../../shared/ui/error-ui/components";
import { FilterField } from "../../../shared/ui/FilterField";
import { MultiSelect } from "../../../shared/ui/MultiSelect";
import { TableLoadingIndicator } from "../../../shared/ui/TableLoadingIndicator";
import { VisualSelect } from "../../../shared/ui/VisualSelect";
import { getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { MAX_BATCH_CUSTOMERS } from "../api";
import { assignmentFlowReducer, initialAssignmentFlowState } from "../hooks/assignmentFlow";
import { useCustomerAssignments } from "../hooks/useCustomerAssignments";
import type { AssignmentClient, AssignmentInput } from "../types";
import { AssignmentConfirmationDialog, AssignmentResultsDialog, RouteWarning } from "./AssignmentDialogs";
import { AssignmentPersistentSummary } from "./AssignmentPersistentSummary";
import { AssignmentReview } from "./AssignmentReview";
import { AssignmentStepper } from "./AssignmentStepper";
import "../styles/customer-assignments.css";

const CLIENT_PAGE_SIZE = 5;
const CLEAR_CONFIRMATION_THRESHOLD = 10;

export function CustomerAssignmentPage() {
  const data = useCustomerAssignments();
  const [flow, dispatch] = useReducer(assignmentFlowReducer, initialAssignmentFlowState);
  const [confirming, setConfirming] = useState(false);
  const [clearConfirming, setClearConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const intentKey = useRef<string | null>(null);
  const sessionKey = useRef(currentSessionKey());
  const confirmTriggerRef = useRef<HTMLButtonElement>(null);
  const admin = getSessionIdentity()?.roles.includes("COMPANY_ADMIN") ?? false;
  const forbidden = data.error?.status === 403;

  useEffect(() => subscribeToSession(() => {
    const next = currentSessionKey();
    if (next === sessionKey.current) return;
    sessionKey.current = next;
    intentKey.current = null;
    setConfirming(false);
    setClearConfirming(false);
    setBusy(false);
    dispatch({ type: "reset" });
  }), []);
  /* eslint-disable react-hooks/set-state-in-effect -- la revocación requiere descartar inmediatamente el borrador y los diálogos. */
  useEffect(() => {
    if (!forbidden) return;
    intentKey.current = null;
    setConfirming(false);
    setClearConfirming(false);
    setBusy(false);
    dispatch({ type: "reset" });
  }, [forbidden]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const activeClients = useMemo(() => data.clients.filter((client) => client.status === "ACTIVE"), [data.clients]);
  const activeSellers = useMemo(() => data.sellers.filter((seller) => seller.status === "ACTIVE"), [data.sellers]);
  const activeTerritories = useMemo(() => data.territories.filter((territory) => territory.status === "ACTIVE"), [data.territories]);
  const sellerLabels = useMemo(() => new Map(data.sellers.map((seller) => [seller.id, seller.displayName])), [data.sellers]);
  const territoryLabels = useMemo(() => new Map(data.territories.map((territory) => [territory.id, territory.name])), [data.territories]);
  const clientById = useMemo(() => new Map(data.clients.map((client) => [client.id, client])), [data.clients]);
  const selectedClients = useMemo(() => flow.selectedCustomerIds.flatMap((id) => clientById.get(id) ? [clientById.get(id)!] : []), [clientById, flow.selectedCustomerIds]);
  const sellerNames = flow.sellerIds.map((id) => sellerLabels.get(id) ?? "Responsable no disponible").join(", ");
  const currentOwners = (client: AssignmentClient) => client.assignedSellerIds.length ? client.assignedSellerIds.map((id) => sellerLabels.get(id) ?? "Responsable no disponible").join(", ") : "Sin asignar";
  const configurationValid = flow.sellerIds.length > 0 && flow.sellerIds.every((id) => activeSellers.some((seller) => seller.id === id)) && validIsoDate(flow.effectiveFrom) && flow.reason.length <= 500;
  const filtersActive = Boolean(flow.query.trim() || flow.territoryId);
  const filteredClients = useMemo(() => activeClients.filter((client) => client.name.toLocaleLowerCase().includes(flow.query.trim().toLocaleLowerCase()) && (!flow.territoryId || client.territoryId === flow.territoryId)), [activeClients, flow.query, flow.territoryId]);
  const clientTotalPages = Math.ceil(filteredClients.length / CLIENT_PAGE_SIZE);
  const safeClientPage = Math.min(flow.page, Math.max(0, clientTotalPages - 1));
  const visibleClients = filteredClients.slice(safeClientPage * CLIENT_PAGE_SIZE, (safeClientPage + 1) * CLIENT_PAGE_SIZE);
  const visibleEligibleClients = visibleClients.filter((client) => !sameSellerSet(client.assignedSellerIds, flow.sellerIds));
  const visibleAdditions = visibleEligibleClients.filter((client) => !flow.selectedCustomerIds.includes(client.id));
  const selectionAtLimit = flow.selectedCustomerIds.length >= MAX_BATCH_CUSTOMERS;

  useEffect(() => {
    if (safeClientPage !== flow.page) dispatch({ type: "set-page", page: safeClientPage });
  }, [flow.page, safeClientPage]);

  const invalidateIntent = () => { intentKey.current = null; };
  const changeSellers = (sellerIds: readonly string[]) => {
    invalidateIntent();
    dispatch({ type: "set-sellers", sellerIds });
    if (sellerIds.length === 0) return;
    const noChangeIds = selectedClients.filter((client) => sameSellerSet(client.assignedSellerIds, sellerIds)).map((client) => client.id);
    dispatch({ type: "remove-no-change-clients", customerIds: noChangeIds });
  };
  const removeClient = (client: AssignmentClient) => { invalidateIntent(); dispatch({ type: "remove-client", customerId: client.id, customerName: client.name }); };
  const clearClients = () => { invalidateIntent(); dispatch({ type: "clear-clients" }); setClearConfirming(false); };
  const requestClear = () => flow.selectedCustomerIds.length >= CLEAR_CONFIRMATION_THRESHOLD ? setClearConfirming(true) : clearClients();
  const continueFromConfiguration = () => {
    if (!configurationValid) { dispatch({ type: "show-configuration-errors" }); return; }
    dispatch({ type: "go-to", step: "clients" });
  };
  const openConfirmation = () => {
    if (!configurationValid || flow.selectedCustomerIds.length === 0 || busy) return;
    intentKey.current ??= crypto.randomUUID();
    setConfirming(true);
  };
  const submit = async () => {
    if (busy || !configurationValid || flow.selectedCustomerIds.length === 0) return;
    setBusy(true);
    const input: AssignmentInput = { customerIds: flow.selectedCustomerIds, sellerIds: flow.sellerIds, effectiveFrom: flow.effectiveFrom, reason: flow.reason };
    const ok = await data.submit(input, intentKey.current ??= crypto.randomUUID());
    setBusy(false);
    setConfirming(false);
    if (!ok) dispatch({ type: "go-to", step: "clients" });
  };
  const closeResults = () => {
    data.clearResults();
    intentKey.current = null;
    dispatch({ type: "set-sellers", sellerIds: [] });
    dispatch({ type: "set-reason", reason: "" });
    dispatch({ type: "clear-clients" });
    dispatch({ type: "go-to", step: "configure" });
  };

  if (!admin) return <section className="customer-assignment customer-assignment--state"><PageHeader /><AsyncStateCard variant="golden" tone="error" title="No tienes permisos" description="Esta operación está disponible únicamente para administradores de empresa." /></section>;
  if (forbidden) return <section className="customer-assignment customer-assignment--state"><PageHeader /><AsyncStateCard variant="golden" tone="error" title="No tienes permisos" description="Ya no tienes permiso para consultar esta cartera." correlationId={data.error?.correlationId ?? null} /></section>;
  if (data.loading && data.clients.length === 0 && data.error === null) return <section className="customer-assignment customer-assignment--state"><PageHeader /><DataTablePanel ariaLabel="Preparando asignación"><DataTableResultsHeader description="Cargando clientes, vendedores y zonas activos" /><TableLoadingIndicator variant="golden" columns={4} label="Preparando asignación" /></DataTablePanel></section>;
  if (data.error && data.clients.length === 0) return <section className="customer-assignment customer-assignment--state"><PageHeader /><AsyncStateCard variant="golden" tone="error" title="No pudimos preparar la asignación" description="No pudimos cargar clientes, vendedores y zonas activos." correlationId={data.error.correlationId} actionLabel="Reintentar" onAction={data.reload} /></section>;
  if (!data.loading && activeClients.length === 0) return <section className="customer-assignment customer-assignment--state"><PageHeader /><DataTablePanel ariaLabel="Clientes activos"><AsyncStateCard variant="golden" title="No hay clientes activos disponibles" description="Solo se cargan clientes, vendedores y zonas activos autorizados para esta empresa." /></DataTablePanel></section>;

  const columns: readonly DataTableColumn<AssignmentClient>[] = [
    { id: "client", header: "Cliente", label: "Cliente", width: "34%", render: (client) => <DataTableIdentity mark={initials(client.name)} primary={client.name} secondary="Cliente activo" /> },
    { id: "territory", header: "Zona", label: "Zona", width: "18%", render: (client) => client.territoryId ? territoryLabels.get(client.territoryId) ?? "Zona no disponible" : "Sin zona" },
    { id: "owners", header: "Responsables actuales", label: "Responsables actuales", width: "32%", render: (client) => <span className="customer-assignment__owner"><strong>{currentOwners(client)}</strong><small>{client.assignedSellerIds.length ? `${client.assignedSellerIds.length} vigente${client.assignedSellerIds.length === 1 ? "" : "s"}` : "Sin responsables vigentes"}</small></span> },
    { id: "action", header: <span className="sr-only">Acción</span>, label: "Acción", width: "16%", align: "right", render: (client) => {
      const selected = flow.selectedCustomerIds.includes(client.id);
      const noChange = sameSellerSet(client.assignedSellerIds, flow.sellerIds);
      if (noChange) return <span className="customer-assignment__no-change" title="El cliente ya tiene exactamente estos responsables"><Check aria-hidden="true" /><span>Sin cambios</span></span>;
      const label = selected ? `Quitar ${client.name} de la asignación` : `Agregar ${client.name} a la asignación`;
      return <Button className={`customer-assignment__add-action${selected ? " customer-assignment__add-action--selected" : ""}`} size="compact" iconOnly aria-label={label} title={label} disabled={!selected && selectionAtLimit} onClick={() => { invalidateIntent(); dispatch(selected ? { type: "remove-client", customerId: client.id, customerName: client.name } : { type: "add-client", customerId: client.id, customerName: client.name }); }}>{selected ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}</Button>;
    } },
  ];

  return <section className="customer-assignment" aria-labelledby="customer-assignment-title">
    <PageHeader />
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{flow.announcement}</p>
    <div className="customer-assignment__layout">
      <section className="customer-assignment__flow" aria-label="Flujo guiado de asignación">
        <AssignmentStepper step={flow.step} selectedCount={flow.selectedCustomerIds.length} />
        <div className="customer-assignment__step-panel">
          {data.error && <OperationError status={data.error.status} correlationId={data.error.correlationId} onRetry={data.reload} />}
          {flow.step === "configure" && <>
            <StepIntro number="1" title="Nuevos responsables y vigencia" description="Los responsables elegidos reemplazarán el conjunto actual de cada cliente agregado." aside={flow.selectedCustomerIds.length ? selectedCountLabel(flow.selectedCustomerIds.length) : "Sin clientes aún"} />
            {flow.configurationAttempted && !configurationValid && <InlineAlert variant="error" title="Revisa los campos obligatorios" message="Selecciona al menos un responsable activo e indica una fecha de vigencia válida." />}
            <div className="customer-assignment__form-grid">
              <div className="customer-assignment__wide"><MultiSelect variant="golden" searchable label="Nuevos responsables" ariaLabel="Nuevos responsables" value={flow.sellerIds} options={activeSellers.map((seller) => ({ value: seller.id, label: seller.displayName, description: "Activo" }))} onChange={changeSellers} placeholder="Selecciona nuevos responsables" selectionNoun="responsables" invalid={flow.configurationAttempted && flow.sellerIds.length === 0} {...(flow.configurationAttempted && flow.sellerIds.length === 0 ? { describedBy: "assignment-sellers-error" } : {})} />{flow.configurationAttempted && flow.sellerIds.length === 0 && <p className="customer-assignment__field-error" id="assignment-sellers-error">Selecciona al menos un responsable activo.</p>}</div>
              <div><DateFilterField variant="golden" label="Vigente desde" value={flow.effectiveFrom} onValueChange={(effectiveFrom) => { invalidateIntent(); dispatch({ type: "set-effective-from", effectiveFrom }); }} required invalid={flow.configurationAttempted && !validIsoDate(flow.effectiveFrom)} {...(flow.configurationAttempted && !validIsoDate(flow.effectiveFrom) ? { describedBy: "assignment-date-error" } : {})} />{flow.configurationAttempted && !validIsoDate(flow.effectiveFrom) && <p className="customer-assignment__field-error" id="assignment-date-error">Indica una fecha de vigencia válida.</p>}</div>
              <div className="customer-assignment__reason"><label htmlFor="assignment-reason">Motivo (opcional)</label><textarea id="assignment-reason" value={flow.reason} maxLength={500} aria-describedby="assignment-reason-count" onChange={(event) => { invalidateIntent(); dispatch({ type: "set-reason", reason: event.target.value }); }} /><small id="assignment-reason-count">{flow.reason.length} de 500 caracteres</small></div>
            </div>
            {activeSellers.length === 0 && <InlineAlert variant="error" title="No hay vendedores activos" message="Necesitas al menos un vendedor activo para crear una asignación." />}
            <RouteWarning />
          </>}
          {flow.step === "clients" && <>
            <StepIntro number="2" title="Buscar y agregar clientes" description="Agregar no abre el detalle: incorpora el cliente a esta operación. Los clientes que ya tienen exactamente los nuevos responsables no requieren cambios." aside={selectedCountLabel(flow.selectedCustomerIds.length)} />
            {selectionAtLimit && <InlineAlert variant="error" title="Alcanzaste el máximo de 1000 clientes" message="Quita un cliente antes de agregar otro. La página y los filtros se conservan." />}
            <DataTablePanel ariaLabel="Clientes activos para asignar">
              <DataTableToolbar filterCount={1}>
                <SearchField id="assignment-client-search" label="Buscar clientes" value={flow.query} placeholder="Nombre del cliente" onChange={(query) => dispatch({ type: "set-query", query })} />
                <FilterField label="Zona"><VisualSelect variant="golden" ariaLabel="Filtrar por zona" value={flow.territoryId || "ALL"} options={[{ value: "ALL", label: "Todas las zonas" }, ...activeTerritories.map((territory) => ({ value: territory.id, label: territory.name }))]} onChange={(value) => dispatch({ type: "set-territory", territoryId: value === "ALL" ? "" : value })} /></FilterField>
              </DataTableToolbar>
              {filtersActive && <div className="customer-assignment__active-filters"><span>Filtros activos:</span>{flow.territoryId && <span className="customer-assignment__chip">Zona: {territoryLabels.get(flow.territoryId) ?? flow.territoryId}</span>}{flow.query.trim() && <span className="customer-assignment__chip">Búsqueda: {flow.query.trim()}</span>}<Button variant="ghost" size="compact" onClick={() => { dispatch({ type: "set-query", query: "" }); dispatch({ type: "set-territory", territoryId: "" }); }}>Limpiar</Button></div>}
              {filteredClients.length === 0 ? <AsyncStateCard variant="golden" title="No encontramos clientes" description={`Cambia la búsqueda o la zona. Tus ${flow.selectedCustomerIds.length} clientes agregados siguen en la operación.`} actionLabel="Limpiar filtros" onAction={() => { dispatch({ type: "set-query", query: "" }); dispatch({ type: "set-territory", territoryId: "" }); }} /> : <>
                <DataTableResultsHeader description={`${safeClientPage * CLIENT_PAGE_SIZE + 1}–${Math.min((safeClientPage + 1) * CLIENT_PAGE_SIZE, filteredClients.length)} de ${filteredClients.length} clientes activos`} status={<div className="customer-assignment__table-tools">{data.loading && <TableLoadingIndicator variant="golden" compact label="Actualizando clientes" />}<Button size="compact" disabled={visibleAdditions.length === 0 || selectionAtLimit} title={visibleEligibleClients.length === 0 ? "Todos los clientes visibles ya tienen exactamente los nuevos responsables" : undefined} onClick={() => { invalidateIntent(); dispatch({ type: "add-page", customers: visibleEligibleClients }); }}><Plus aria-hidden="true" />{selectionAtLimit ? "Límite alcanzado" : visibleEligibleClients.length === 0 ? "Sin cambios en esta página" : visibleAdditions.length === 0 ? "Página ya agregada" : `Agregar esta página (${Math.min(visibleAdditions.length, MAX_BATCH_CUSTOMERS - flow.selectedCustomerIds.length)})`}</Button></div>} />
                <DataTable responsive="cards" variant="golden" ariaLabel="Clientes activos" items={visibleClients} rowKey={(client) => client.id} columns={columns} />
                <DataTablePagination variant="golden" showPageSize={false} page={safeClientPage} totalPages={clientTotalPages} pageSize={5} onPageChange={(page) => dispatch({ type: "set-page", page })} onPageSizeChange={() => undefined} ariaLabel="Paginación de clientes" summary={<>Mostrando {safeClientPage * CLIENT_PAGE_SIZE + 1}–{Math.min((safeClientPage + 1) * CLIENT_PAGE_SIZE, filteredClients.length)} de {filteredClients.length} clientes</>} />
              </>}
            </DataTablePanel>
          </>}
          {flow.step === "review" && <>
            <StepIntro number="3" title="Revisar y confirmar" description="Comprueba los cambios de responsable antes de enviar la operación." aside={`${flow.selectedCustomerIds.length} clientes`} />
            <RouteWarning />
            <AssignmentReview clients={selectedClients} sellerNames={sellerNames} effectiveFrom={flow.effectiveFrom} reason={flow.reason} currentOwners={currentOwners} page={flow.reviewPage} onPageChange={(page) => dispatch({ type: "set-review-page", page })} />
          </>}
        </div>
        <footer className="customer-assignment__flow-actions"><span>Paso {flow.step === "configure" ? 1 : flow.step === "clients" ? 2 : 3} de 3{flow.step === "clients" ? " · La selección se conserva entre páginas" : ""}</span><div>
          {flow.step === "clients" && <Button onClick={() => dispatch({ type: "go-to", step: "configure" })}>Volver a configuración</Button>}
          {flow.step === "review" && <Button onClick={() => dispatch({ type: "go-to", step: "clients" })}>Volver a clientes</Button>}
          {flow.step === "configure" && <Button variant="primary" onClick={continueFromConfiguration} disabled={activeSellers.length === 0}>Continuar a clientes</Button>}
          {flow.step === "clients" && <Button variant="primary" onClick={() => dispatch({ type: "go-to", step: "review" })} disabled={flow.selectedCustomerIds.length === 0}>Continuar a revisión</Button>}
          {flow.step === "review" && <Button ref={confirmTriggerRef} variant="primary" onClick={openConfirmation} disabled={busy || !configurationValid || flow.selectedCustomerIds.length === 0}>{busy ? "Asignando…" : "Confirmar operación"}</Button>}
        </div></footer>
      </section>
      <AssignmentPersistentSummary sellerNames={sellerNames} effectiveFrom={flow.effectiveFrom} reason={flow.reason} clients={selectedClients} currentOwners={currentOwners} onRemove={removeClient} onViewAll={() => dispatch({ type: "go-to", step: "review" })} onClear={requestClear} />
    </div>
    {confirming && <AssignmentConfirmationDialog clients={selectedClients} sellerNames={sellerNames} effectiveFrom={flow.effectiveFrom} reason={flow.reason} busy={busy} returnFocusRef={confirmTriggerRef} onCancel={() => { if (!busy) setConfirming(false); }} onConfirm={() => void submit()} />}
    {clearConfirming && <ConfirmationDialog appearance="golden" titleId="assignment-clear-title" descriptionId="assignment-clear-description" title="Vaciar clientes seleccionados" message={`Quitarás ${flow.selectedCustomerIds.length} clientes de esta operación. La configuración de responsables y vigencia se conservará.`} confirmLabel="Vaciar selección" cancelLabel="Seguir revisando" onCancel={() => setClearConfirming(false)} onConfirm={clearClients} />}
    {data.results.length > 0 && <AssignmentResultsDialog results={data.results} customerNames={new Map(data.clients.map((client) => [client.id, client.name]))} onClose={closeResults} />}
  </section>;
}

function PageHeader() {
  return <header className="customer-assignment__header"><div><span className="customer-assignment__eyebrow">Cartera comercial</span><h1 id="customer-assignment-title">Asignar cartera</h1><p>Completa los datos en tres pasos. Puedes volver sin perder la configuración ni los clientes agregados.</p></div></header>;
}

function StepIntro({ number, title, description, aside }: { number: string; title: string; description: string; aside: string }) {
  return <header className="customer-assignment__step-intro"><div><h2>{number}. {title}</h2><p>{description}</p></div><span className="customer-assignment__step-aside">{aside}</span></header>;
}

function OperationError({ status, correlationId, onRetry }: { status: number; correlationId: string | null; onRetry: () => void }) {
  const preservable = status === 409 || status === 422;
  const title = status === 400 ? "La solicitud no pudo validarse" : status === 403 ? "Ya no tienes permisos" : status === 404 ? "Uno de los recursos ya no existe" : status === 409 ? "La información cambió" : status === 422 ? "Revisa la asignación" : "No pudimos completar la operación";
  return <InlineAlert variant={preservable ? "warning" : "error"} title={title} message={preservable ? "Conservamos la configuración, la selección, los filtros y la página para que puedas corregirla." : "Actualiza los datos antes de volver a intentarlo."} {...(correlationId ? { correlationId } : {})} action={{ label: "Actualizar datos", onClick: onRetry }} />;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function validIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]);
}

function sameSellerSet(currentSellerIds: readonly string[], nextSellerIds: readonly string[]) {
  if (nextSellerIds.length === 0 || currentSellerIds.length !== nextSellerIds.length) return false;
  const next = new Set(nextSellerIds);
  return currentSellerIds.every((id) => next.has(id));
}

function selectedCountLabel(count: number) {
  return `${count} cliente${count === 1 ? "" : "s"} seleccionado${count === 1 ? "" : "s"}`;
}

function currentSessionKey() {
  const identity = getSessionIdentity();
  return `${identity?.id ?? ""}:${JSON.stringify(identity?.company ?? null)}`;
}
