import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { listRouteSellerOptions, listRoutes } from "../api";
import type { RouteFilters, RoutePage, RouteSellerOption, RouteStatus } from "../types";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";

const emptySellers: readonly RouteSellerOption[] = [];
export function routeSessionKey(): string {
  const identity = getSessionIdentity(); const company = identity?.company;
  const companyId = typeof company === "object" && company !== null && typeof (company as Record<string, unknown>).id === "string" ? (company as Record<string, unknown>).id : String(company);
  return identity ? `${getSessionGeneration()}:${identity.id}:${companyId}:${[...identity.roles].sort().join(",")}` : `${getSessionGeneration()}:anonymous`;
}
function canListRoutes() { const roles = getSessionIdentity()?.roles ?? []; return roles.includes("COMPANY_ADMIN") || roles.includes("SUPERVISOR"); }

export function useRoutes() {
  const key = routeSessionKey(); const keyRef = useRef(key); const requestRef = useRef(0);
  const [date, setDate] = useState(""); const [sellerId, setSellerId] = useState<string | null>(null); const [status, setStatus] = useState<RouteStatus | null>(null);
  const [page, setPage] = useState(0); const [pageSize, setPageSize] = useState<DataTablePageSize>(5); const [result, setResult] = useState<RoutePage | null>(null); const [sellers, setSellers] = useState<readonly RouteSellerOption[]>(emptySellers);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<ApiError | null>(null); const [forbidden, setForbidden] = useState(false); const [lastUpdated, setLastUpdated] = useState<Date | null>(null); const [reloadKey, setReloadKey] = useState(0);
  const clear = () => { setDate(""); setSellerId(null); setStatus(null); setPage(0); };
  useEffect(() => {
    if (!canListRoutes() || forbidden) return;
    const requestId = ++requestRef.current; const filters: RouteFilters = { page, pageSize, date, sellerId, status };
    void Promise.resolve().then(() => { if (requestId === requestRef.current) setLoading(true); return Promise.all([listRoutes(filters), listRouteSellerOptions()]); }).then(async ([routes, options]) => {
      if (requestId !== requestRef.current) return;
      const failed = routes.response.status === 200 && routes.page && options.response.status === 200 && options.sellers ? null : await normalizeApiError(routes.response.status === 200 ? options.response : routes.response);
      if (failed?.status === 403 || failed?.status === 404) { setResult(null); setSellers(emptySellers); clear(); setError(null); setLastUpdated(null); setForbidden(true); }
      else if (failed) setError(failed);
      else if (routes.page && options.sellers) { setResult(routes.page); setSellers(options.sellers); setError(null); setLastUpdated(new Date()); }
    }).catch((reason) => { if (requestId === requestRef.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }).finally(() => { if (requestId === requestRef.current) setLoading(false); });
  }, [date, forbidden, key, page, pageSize, reloadKey, sellerId, status]);
  useEffect(() => subscribeToSession(() => { const next = routeSessionKey(); if (keyRef.current === next) return; requestRef.current += 1; keyRef.current = next; clear(); setResult(null); setSellers(emptySellers); setError(null); setLastUpdated(null); setForbidden(false); setLoading(false); setReloadKey((value) => value + 1); }), []);
  const change = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(0); };
  return { sessionKey: key, date, sellerId, status, page, pageSize, result, sellers, loading, error, forbidden, lastUpdated, changeDate: change(setDate), changeSeller: change(setSellerId), changeStatus: change(setStatus), goToPage: setPage, changePageSize: (value: DataTablePageSize) => { setPageSize(value); setPage(0); }, clearFilters: clear, retry: () => { setForbidden(false); setError(null); setReloadKey((value) => value + 1); } };
}
