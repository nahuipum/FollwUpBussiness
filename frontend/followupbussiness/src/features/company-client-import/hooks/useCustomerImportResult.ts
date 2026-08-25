import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { downloadCustomerImportErrors, getCustomerImport } from "../api";
import type { CustomerImportJob, ImportFailure } from "../types";

const terminal = new Set(["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"]);
const requestTimeoutMs = 15_000;
const sessionKey = () => { const identity = getSessionIdentity(); return `${getSessionGeneration()}:${identity?.id ?? "anonymous"}:${JSON.stringify(identity?.company ?? null)}:${identity?.roles.join(",") ?? ""}`; };

export function useCustomerImportResult(importId: string) {
  const [job, setJob] = useState<CustomerImportJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<ImportFailure | null>(null);
  const [stale, setStale] = useState(false);
  const [expired, setExpired] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const keyRef = useRef(sessionKey());
  const requestRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const downloadControllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const jobRef = useRef<CustomerImportJob | null>(null);

  const clear = useCallback(() => {
    requestRef.current += 1;
    controllerRef.current?.abort();
    downloadControllerRef.current?.abort();
    controllerRef.current = null;
    downloadControllerRef.current = null;
    inFlightRef.current = false;
    jobRef.current = null;
    setJob(null); setLoading(false); setDownloading(false); setError(null); setStale(false); setExpired(false); setForbidden(false); setLastUpdatedAt(null);
  }, []);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const current = ++requestRef.current;
    const controller = new AbortController();
    let timedOut = false;
    let rejectTimeout: (reason: Error) => void = () => undefined;
    const timeoutResult = new Promise<never>((_resolve, reject) => {
      rejectTimeout = reject;
    });
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
      rejectTimeout(new Error("La consulta de importación excedió el tiempo de espera."));
    }, requestTimeoutMs);
    controllerRef.current?.abort();
    controllerRef.current = controller;
    setLoading((previous) => previous || jobRef.current === null);
    try {
      const result = await Promise.race([getCustomerImport(importId, controller.signal), timeoutResult]);
      if (current !== requestRef.current) return;
      if (result.response.status === 200 && result.job !== null) {
        jobRef.current = result.job;
        setJob(result.job); setError(null); setStale(false); setForbidden(false); setLastUpdatedAt(new Date().toISOString());
      } else if (result.response.status === 403 || result.response.status === 404) {
        jobRef.current = null;
        setJob(null); setError(result.response.status === 404 ? { status: 404, correlationId: result.correlationId } : null); setStale(false); setForbidden(result.response.status === 403);
      } else {
        setError({ status: result.response.status, correlationId: result.correlationId });
        setStale(jobRef.current !== null);
      }
    } catch (reason) {
      if (current === requestRef.current && !(reason instanceof ApiRequestObsoleteError) && (!controller.signal.aborted || timedOut)) {
        setError({ status: 500, correlationId: null }); setStale(jobRef.current !== null);
      }
    } finally {
      window.clearTimeout(timeout);
      if (current === requestRef.current) { inFlightRef.current = false; setLoading(false); }
    }
  }, [importId]);

  useEffect(() => { void refresh(); return () => { requestRef.current += 1; inFlightRef.current = false; controllerRef.current?.abort(); downloadControllerRef.current?.abort(); }; }, [refresh]);
  useEffect(() => subscribeToSession(() => { const next = sessionKey(); if (next !== keyRef.current) { keyRef.current = next; clear(); } }), [clear]);
  useEffect(() => {
    if (job === null || terminal.has(job.status) || stale || forbidden) return;
    const timer = window.setTimeout(() => { void refresh(); }, 2000);
    return () => window.clearTimeout(timer);
  }, [forbidden, job, refresh, stale]);

  const downloadErrors = async () => {
    if (job === null || downloading || job.rejectedRows === 0 || terminal.has(job.status) === false || expired) return;
    setDownloading(true); setError(null);
    const controller = new AbortController();
    downloadControllerRef.current?.abort();
    downloadControllerRef.current = controller;
    try {
      const result = await downloadCustomerImportErrors(job.id, controller.signal);
      if (result.response.status === 200 && result.blob !== null) {
        const url = URL.createObjectURL(result.blob);
        const anchor = document.createElement("a"); anchor.href = url; anchor.download = "errores-importacion-clientes.csv"; anchor.click(); URL.revokeObjectURL(url);
      } else if (result.response.status === 410) {
        setExpired(true);
      } else if (result.response.status === 403 || result.response.status === 404) {
        jobRef.current = null;
        setJob(null); setError(null); setStale(false); setForbidden(result.response.status === 403);
      } else {
        setError({ status: result.response.status, correlationId: result.correlationId });
      }
    } catch (reason) {
      if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null });
    } finally { setDownloading(false); }
  };

  return { job, loading, downloading, error, stale, expired, forbidden, lastUpdatedAt, polling: job !== null && !terminal.has(job.status), refresh, downloadErrors };
}
