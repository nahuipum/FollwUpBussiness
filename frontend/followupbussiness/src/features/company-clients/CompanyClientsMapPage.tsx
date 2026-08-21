import { useEffect, useRef, useState, type UIEvent } from "react";
import { AsyncStateCard } from "../../shared/ui/AsyncStateCard";
import { InlineAlert } from "../../shared/ui/error-ui/components";
import { TableLoadingIndicator } from "../../shared/ui/TableLoadingIndicator";
import { ClientFilters } from "./components/ClientFilters";
import { ClientMap } from "./components/ClientMap";
import { useClientMap } from "./hooks/useClientMap";
import type { Client } from "./types";
import { getSessionIdentity, subscribeToSession } from "../auth/auth";
import { clientSessionKey } from "./hooks/useClients";
import "./styles/company-clients.css";

export function CompanyClientsMapPage() {
  const [sessionKey, setSessionKey] = useState(clientSessionKey);
  useEffect(() => subscribeToSession(() => setSessionKey(clientSessionKey())), []);
  return <ClientMapPageContent key={sessionKey} />;
}

function ClientMapPageContent() {
  const clients = useClientMap(); const isSupervisor = getSessionIdentity()?.roles.includes("SUPERVISOR") ?? false; const [selectedId, setSelectedId] = useState<string | null>(null); const [focusVersion, setFocusVersion] = useState(0); const items = clients.result?.items ?? []; const hasFilters = Boolean(clients.search || clients.status || clients.withoutVisitSince || clients.withoutPurchaseSince); const mapPointer = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  useEffect(() => { const onMove = (event: PointerEvent) => { const start = mapPointer.current; if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) start.dragged = true; }; const clearPointer = () => { mapPointer.current = null; }; window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", clearPointer); window.addEventListener("pointercancel", clearPointer); return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", clearPointer); window.removeEventListener("pointercancel", clearPointer); }; }, []);
  const selectClient = (clientId: string | null) => { setSelectedId(clientId); if (clientId) setFocusVersion((value) => value + 1); };
  const emptyDescription = isSupervisor ? "No hay clientes disponibles para tu equipo en este momento." : "Cuando existan clientes aparecerán en este mapa.";
 return <section className="client-list client-map-page" aria-labelledby="client-map-page-title" onPointerDownCapture={(event) => { if ((event.target as Element).closest(".client-map__canvas")) mapPointer.current = { x: event.clientX, y: event.clientY, dragged: false }; }} onClickCapture={(event) => { const dragged = mapPointer.current?.dragged ?? false; mapPointer.current = null; if (!dragged && !(event.target as Element).closest("[data-client-map-selection]")) setSelectedId(null); }}><header className="client-list__heading"><div><h1 id="client-map-page-title">Mapa general de clientes</h1><p>Consulta la ubicación registrada de los clientes autorizados sin exponer datos de contacto.</p></div></header><section className="client-list__card" aria-label="Mapa de clientes"><ClientFilters query={clients.search} status={clients.status} territoryId={null} sellerId={null} withoutVisitSince={clients.withoutVisitSince} withoutPurchaseSince={clients.withoutPurchaseSince} options={{ territories: [], sellers: [] }} onQueryChange={clients.changeSearch} onStatusChange={clients.changeStatus} onTerritoryChange={() => undefined} onSellerChange={() => undefined} onWithoutVisitSinceChange={clients.changeWithoutVisitSince} onWithoutPurchaseSinceChange={clients.changeWithoutPurchaseSince} showAssignmentFilters={false} />{clients.error && <InlineAlert variant="error" title={clients.error.status === 403 ? "No tienes permisos" : "Ocurrió un problema temporal"} message={clients.error.status === 403 ? "No tienes permiso para consultar el mapa de clientes." : "No pudimos actualizar los clientes. El mapa mostrado puede no estar vigente."} action={{ label: "Reintentar", onClick: clients.retry }} {...(clients.error.correlationId ? { correlationId: clients.error.correlationId } : {})} />}{clients.forbidden ? <AsyncStateCard tone="error" title="No tienes permisos" description="No tienes permiso para consultar el mapa de clientes." actionLabel="Reintentar" onAction={clients.retry} /> : clients.loading && items.length === 0 ? <TableLoadingIndicator label="Cargando clientes" /> : !clients.error && items.length === 0 && !hasFilters ? <AsyncStateCard title="Aún no hay clientes" description={emptyDescription} /> : <><div className="client-map-page__content"><ClientMap clients={items} selectedId={selectedId} focusVersion={focusVersion} onSelect={selectClient} empty={items.length === 0} /><ClientMapList clients={items} selectedId={selectedId} onSelect={selectClient} /></div>{clients.loading && <div className="client-list__stale"><TableLoadingIndicator label="Actualizando clientes; la información mostrada puede no estar vigente" compact /></div>}</>}</section></section>;
}

function ClientMapList({ clients, selectedId, onSelect }: { clients: readonly Client[]; selectedId: string | null; onSelect: (clientId: string) => void }) {
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.max(0, Math.floor(scrollTop / MAP_LIST_ROW_HEIGHT) - MAP_LIST_OVERSCAN); const end = Math.min(clients.length, Math.ceil((scrollTop + MAP_LIST_HEIGHT) / MAP_LIST_ROW_HEIGHT) + MAP_LIST_OVERSCAN);
  const onScroll = (event: UIEvent<HTMLDivElement>) => setScrollTop(event.currentTarget.scrollTop);
  return <section className="client-map-list" aria-labelledby="client-map-list-title"><header><div><h2 id="client-map-list-title">Clientes en el mapa</h2><p>{clients.length} clientes. Selecciona uno para ubicarlo.</p></div></header>{clients.length === 0 ? <p className="client-map-list__empty">No encontramos clientes.</p> : <div className="client-map-list__viewport" role="list" aria-label="Clientes visibles en el mapa" onScroll={onScroll}><div style={{ height: clients.length * MAP_LIST_ROW_HEIGHT }}><ul style={{ transform: `translateY(${start * MAP_LIST_ROW_HEIGHT}px)` }}>{clients.slice(start, end).map((client) => <li key={client.id} role="listitem"><button data-client-map-selection type="button" className={selectedId === client.id ? "client-map-list__item client-map-list__item--selected" : "client-map-list__item"} aria-pressed={selectedId === client.id} onClick={() => onSelect(client.id)}><span>{client.name}</span><span className={`client-map-list__status client-map-list__status--${client.status.toLowerCase()}`}>{client.status === "ACTIVE" ? "Activo" : "Inactivo"}</span></button></li>)}</ul></div></div>}</section>;
}

const MAP_LIST_HEIGHT = 360;
const MAP_LIST_ROW_HEIGHT = 58;
const MAP_LIST_OVERSCAN = 4;
