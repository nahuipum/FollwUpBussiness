import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { listClientFilterOptions, listClients } from "../api";
import type { ClientFilterOptions, ClientFilters, ClientPage, ClientStatus } from "../types";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";

const emptyOptions: ClientFilterOptions = { territories: [], sellers: [] };
export function clientSessionKey() {
  const identity = getSessionIdentity();
  const company = identity?.company;
  const companyId = typeof company === "object" && company !== null && typeof (company as Record<string, unknown>).id === "string" ? (company as Record<string, unknown>).id : String(company);
  return identity ? `${getSessionGeneration()}:${identity.id}:${companyId}:${[...identity.roles].sort().join(",")}` : `${getSessionGeneration()}:anonymous`;
}
function canListClients() { const roles = getSessionIdentity()?.roles ?? []; return roles.includes("COMPANY_ADMIN") || roles.includes("SUPERVISOR"); }

export function useClients() {
  const key = clientSessionKey(); const keyRef = useRef(key); const requestRef = useRef(0);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState<ClientStatus | null>(null);
  const [territoryId, setTerritoryId] = useState<string | null>(null); const [sellerId, setSellerId] = useState<string | null>(null);
  const [withoutVisitSince, setWithoutVisitSince] = useState(""); const [withoutPurchaseSince, setWithoutPurchaseSince] = useState("");
  const [page, setPage] = useState(0); const [pageSize, setPageSize] = useState<DataTablePageSize>(5);
  const [result, setResult] = useState<ClientPage | null>(null); const [options, setOptions] = useState<ClientFilterOptions>(emptyOptions);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<ApiError | null>(null); const [lastUpdated, setLastUpdated] = useState<Date | null>(null); const [reloadKey, setReloadKey] = useState(0); const [forbidden, setForbidden] = useState(false);
  const clear = () => { setSearch(""); setStatus(null); setTerritoryId(null); setSellerId(null); setWithoutVisitSince(""); setWithoutPurchaseSince(""); setPage(0); };
  useEffect(() => {
    if (!canListClients() || forbidden) return;
    const requestId = ++requestRef.current;
    const filters: ClientFilters = { page, pageSize, search, status, territoryId, sellerId, withoutVisitSince, withoutPurchaseSince };
    void Promise.resolve().then(() => {
      if (requestId === requestRef.current) setLoading(true);
      return Promise.all([listClients(filters), listClientFilterOptions()]);
    }).then(async ([clients, nextOptions]) => {
      if (requestId !== requestRef.current) return;
      const failed = clients.response.status === 200 && clients.page && nextOptions.response.status === 200 && nextOptions.options ? null : await normalizeApiError(clients.response.status === 200 ? nextOptions.response : clients.response);
      if (failed?.status === 403) { setResult(null); setOptions(emptyOptions); clear(); setForbidden(true); }
      else if (failed) setError(failed);
      else if (clients.page && nextOptions.options) { setResult(clients.page); setOptions(nextOptions.options); setError(null); setLastUpdated(new Date()); }
    }).catch((reason) => { if (requestId === requestRef.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }).finally(() => { if (requestId === requestRef.current) setLoading(false); });
  }, [forbidden, key, page, pageSize, reloadKey, search, sellerId, status, territoryId, withoutPurchaseSince, withoutVisitSince]);
  useEffect(() => subscribeToSession(() => { const next = clientSessionKey(); if (keyRef.current === next) return; requestRef.current += 1; keyRef.current = next; clear(); setResult(null); setOptions(emptyOptions); setError(null); setLastUpdated(null); setForbidden(false); setLoading(false); setReloadKey((value) => value + 1); }), []);
  const change = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(0); };
  return { search, status, territoryId, sellerId, withoutVisitSince, withoutPurchaseSince, page, pageSize, result, options, loading, error, lastUpdated, forbidden,
    changeSearch: change(setSearch), changeStatus: change(setStatus), changeTerritory: change(setTerritoryId), changeSeller: change(setSellerId), changeWithoutVisitSince: change(setWithoutVisitSince), changeWithoutPurchaseSince: change(setWithoutPurchaseSince),
    goToPage: setPage, changePageSize: (value: DataTablePageSize) => { setPageSize(value); setPage(0); }, clearFilters: clear, retry: () => { setForbidden(false); setError(null); setReloadKey((value) => value + 1); } };
}
