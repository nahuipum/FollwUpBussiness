import { useRef, useState } from "react";
import {
  ApiRequestObsoleteError,
  normalizeApiError,
  type ApiError,
} from "../../../lib/api";
import { getCompanyUser } from "../api";
import type { CompanyUser } from "../types";

export function useCompanyUserDetail() {
  const requestRef = useRef(0);
  const targetIdRef = useRef<string | null>(null);
  const [user, setUser] = useState<CompanyUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const open = async (id: string) => {
    targetIdRef.current = id;
    const requestId = ++requestRef.current;
    setUser(null);
    setError(null);
    setLoading(true);
    try {
      const result = await getCompanyUser(id);
      if (requestId !== requestRef.current) return;
      if (result.response.status === 200 && result.user !== null) setUser(result.user);
      else setError(await normalizeApiError(result.response));
    } catch (reason) {
      if (requestId === requestRef.current && !(reason instanceof ApiRequestObsoleteError))
        setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  const close = () => {
    requestRef.current += 1;
    targetIdRef.current = null;
    setUser(null);
    setError(null);
    setLoading(false);
  };

  return { user, loading, error, open, retry: () => targetIdRef.current && open(targetIdRef.current), close };
}
