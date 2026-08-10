import { useEffect, useRef, useState } from "react";
import type { ApiError } from "../../../lib/api";
import { subscribeToApiErrors } from "../../../lib/api";
import {
  clearSession,
  getSessionGeneration,
  getSessionIdentity,
  hasSession,
  subscribeToSession,
} from "../../../features/auth/auth";

export function useGlobalApiError() {
  const [, setSessionVersion] = useState(0);
  const [error, setError] = useState<ApiError | null>(null);
  const identity = getSessionIdentity();
  const identityKey = identity === null ? null : `${identity.id}:${String(identity.company)}`;
  const previousIdentity = useRef(identityKey);
  const handledUnauthorized = useRef(false);

  useEffect(() => {
    if (previousIdentity.current !== identityKey) {
      previousIdentity.current = identityKey;
      handledUnauthorized.current = false;
      setError(null);
    }
  }, [identityKey]);

  useEffect(
    () => subscribeToSession(() => setSessionVersion((version) => version + 1)),
    [],
  );

  useEffect(
    () =>
      subscribeToApiErrors((nextError, requestGeneration) => {
        if (requestGeneration !== getSessionGeneration()) return;
        if (nextError.status === 401) {
          if (!hasSession() || handledUnauthorized.current) return;
          handledUnauthorized.current = true;
          previousIdentity.current = null;
          clearSession();
        }
        setError(nextError);
      }),
    [],
  );

  return { error, clearError: () => setError(null) };
}
