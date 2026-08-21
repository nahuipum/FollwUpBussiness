import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { listAllClients } from "../api";
import type { ClientFilters, ClientPage, ClientStatus } from "../types";
import { clientSessionKey } from "./useClients";

function canViewClientMap() {
  const roles = getSessionIdentity()?.roles ?? [];
  return roles.includes("COMPANY_ADMIN") || roles.includes("SUPERVISOR");
}

export function useClientMap() {
  const key = clientSessionKey(); const keyRef = useRef(key); const requestRef = useRef(0);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState<ClientStatus | null>(null);
  const [withoutVisitSince, setWithoutVisitSince] = useState(""); const [withoutPurchaseSince, setWithoutPurchaseSince] = useState("");
  const [result, setResult] = useState<ClientPage | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<ApiError | null>(null); const [forbidden, setForbidden] = useState(false); const [lastUpdated, setLastUpdated] = useState<Date | null>(null); const [reloadKey, setReloadKey] = useState(0);
  const clearFilters = () => { setSearch(""); setStatus(null); setWithoutVisitSince(""); setWithoutPurchaseSince(""); };
  useEffect(() => {
    if (!canViewClientMap() || forbidden) return;
    const requestId = ++requestRef.current;
    const filters: Omit<ClientFilters, "page" | "pageSize"> = { search, status, territoryId: null, sellerId: null, withoutVisitSince, withoutPurchaseSince };
    void Promise.resolve().then(() => {
      if (requestId === requestRef.current) setLoading(true);
      return listAllClients(filters);
    }).then(async ({ response, page: next }) => {
      if (requestId !== requestRef.current) return;
      if (response.status === 200 && next) { setResult(next); setError(null); setLastUpdated(new Date()); return; }
      const nextError = (await normalizeApiError(response)) ?? { status: 500, correlationId: null, fieldErrors: [] };
      if (nextError.status === 403) { setResult(null); clearFilters(); setForbidden(true); } else setError(nextError);
    }).catch((reason) => { if (requestId === requestRef.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }).finally(() => { if (requestId === requestRef.current) setLoading(false); });
  }, [forbidden, key, reloadKey, search, status, withoutPurchaseSince, withoutVisitSince]);
  useEffect(() => subscribeToSession(() => { const next = clientSessionKey(); if (keyRef.current === next) return; requestRef.current += 1; keyRef.current = next; clearFilters(); setResult(null); setError(null); setForbidden(false); setLastUpdated(null); setLoading(false); setReloadKey((value) => value + 1); }), []);
  return { search, status, withoutVisitSince, withoutPurchaseSince, result, loading, error, forbidden, lastUpdated, changeSearch: setSearch, changeStatus: setStatus, changeWithoutVisitSince: setWithoutVisitSince, changeWithoutPurchaseSince: setWithoutPurchaseSince, clearFilters, retry: () => { setError(null); setForbidden(false); setReloadKey((value) => value + 1); } };
}
