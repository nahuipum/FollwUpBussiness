import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { listTerritories } from "../api";
import type { TerritoryPage, TerritoryStatus } from "../types";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";

const sessionKey = () => { const identity = getSessionIdentity(); return `${getSessionGeneration()}:${identity?.id ?? "anonymous"}:${JSON.stringify(identity?.company ?? null)}:${identity?.roles.join(",") ?? ""}`; };

export function useTerritories() {
  const currentSessionKey = sessionKey(); const sessionRef = useRef(currentSessionKey); const requestRef = useRef(0);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState<TerritoryStatus | null>(null); const [page, setPage] = useState(0); const [pageSize, setPageSize] = useState<DataTablePageSize>(5);
  const [result, setResult] = useState<TerritoryPage | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<ApiError | null>(null); const [lastUpdated, setLastUpdated] = useState<Date | null>(null); const [reload, setReload] = useState(0);
  useEffect(() => { const timer = window.setTimeout(() => { const request = ++requestRef.current; setLoading(true); void listTerritories({ page, pageSize, search, status }).then(async (next) => { if (request !== requestRef.current) return; if (next.response.status === 200 && next.page) { setResult(next.page); setError(null); setLastUpdated(new Date()); } else setError(await normalizeApiError(next.response)); }).catch((reason) => { if (request === requestRef.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }).finally(() => { if (request === requestRef.current) setLoading(false); }); }, 250); return () => window.clearTimeout(timer); }, [page, pageSize, reload, search, status]);
  useEffect(() => subscribeToSession(() => { const next = sessionKey(); if (next === sessionRef.current) return; requestRef.current += 1; sessionRef.current = next; setSearch(""); setStatus(null); setPage(0); setResult(null); setError(null); setLastUpdated(null); setLoading(false); setReload((value) => value + 1); }), []);
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(0); };
  return { sessionKey: currentSessionKey, search, status, page, pageSize, result, loading, error, lastUpdated, changeSearch: resetPage(setSearch), changeStatus: resetPage(setStatus), goToPage: setPage, changePageSize: (value: DataTablePageSize) => { setPageSize(value); setPage(0); }, retry: () => setReload((value) => value + 1), clearFilters: () => { setSearch(""); setStatus(null); setPage(0); } };
}
