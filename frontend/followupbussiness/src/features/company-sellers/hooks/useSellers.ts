import { useEffect, useMemo, useRef, useState } from "react";
import {
  ApiRequestObsoleteError,
  normalizeApiError,
  type ApiError,
} from "../../../lib/api";
import {
  getSessionGeneration,
  getSessionIdentity,
  subscribeToSession,
} from "../../auth/auth";
import { listSellers } from "../api";
import type { Seller, SellerPage, SellerStatus } from "../types";

const pageSize = 20;

function companyScopeKey(company: unknown): string {
  if (typeof company === "string") return `id:${company}`;
  if (typeof company === "object" && company !== null) {
    const id = (company as Record<string, unknown>).id;
    if (typeof id === "string") return `id:${id}`;
    try {
      return `object:${JSON.stringify(company)}`;
    } catch {
      return "object:unavailable";
    }
  }
  return String(company);
}

/** Scope used to revoke in-memory seller data when auth identity changes. */
export function sellerSessionKey(): string {
  const identity = getSessionIdentity();
  return identity === null
    ? `generation:${getSessionGeneration()}:anonymous`
    : `generation:${getSessionGeneration()}:user:${identity.id}:company:${companyScopeKey(identity.company)}:roles:${[...identity.roles].sort().join(",")}`;
}

export function useSellers() {
  const identity = getSessionIdentity();
  const identityKey = sellerSessionKey();
  const identityRef = useRef(identityKey);
  const requestRef = useRef(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SellerStatus | null>(null);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [territoryId, setTerritoryId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<SellerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const requestId = ++requestRef.current;
      setLoading(true);
      void listSellers({
        page,
        pageSize,
        search,
        status,
        supervisorId,
        territoryId,
      })
        .then(async (next) => {
          if (requestId !== requestRef.current) return;
          if (next.response.status === 200 && next.page) {
            setResult(next.page);
            setError(null);
            setLastUpdated(new Date());
          } else setError(await normalizeApiError(next.response));
        })
        .catch((reason) => {
          if (
            requestId === requestRef.current &&
            !(reason instanceof ApiRequestObsoleteError)
          )
            setError({ status: 500, correlationId: null, fieldErrors: [] });
        })
        .finally(() => {
          if (requestId === requestRef.current) setLoading(false);
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [page, reloadKey, search, status, supervisorId, territoryId]);
  useEffect(
    () =>
      subscribeToSession(() => {
        const nextKey = sellerSessionKey();
        if (identityRef.current === nextKey) return;
        requestRef.current += 1;
        identityRef.current = nextKey;
        setSearch("");
        setStatus(null);
        setSupervisorId(null);
        setTerritoryId(null);
        setPage(0);
        setResult(null);
        setError(null);
        setLastUpdated(null);
        setLoading(false);
        setReloadKey((value) => value + 1);
      }),
    [],
  );
  const filterOptions = useMemo(() => {
    const supervisors = new Map<string, string>();
    const territories = new Map<string, string>();
    result?.items.forEach((seller) => {
      if (seller.supervisor)
        supervisors.set(seller.supervisor.id, seller.supervisor.displayName);
      seller.territories.forEach((territory) =>
        territories.set(territory.id, territory.name),
      );
    });
    return {
      supervisors: [...supervisors].map(([id, label]) => ({ id, label })),
      territories: [...territories].map(([id, label]) => ({ id, label })),
    };
  }, [result]);
  const resetPage =
    <T>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(0);
    };
  return {
    sessionKey: identityKey,
    displayName: identity?.displayName ?? "",
    search,
    status,
    supervisorId,
    territoryId,
    page,
    result,
    loading,
    error,
    lastUpdated,
    filterOptions,
    changeSearch: resetPage(setSearch),
    changeStatus: resetPage(setStatus),
    changeSupervisor: resetPage(setSupervisorId),
    changeTerritory: resetPage(setTerritoryId),
    goToPage: setPage,
    retry: () => setReloadKey((value) => value + 1),
    replaceSeller: (updatedSeller: Seller) =>
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((seller) =>
                seller.id === updatedSeller.id ? updatedSeller : seller,
              ),
            }
          : current,
      ),
    clearFilters: () => {
      setSearch("");
      setStatus(null);
      setSupervisorId(null);
      setTerritoryId(null);
      setPage(0);
    },
  };
}
