import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { createCustomerImport, downloadCustomerImportTemplate, getCustomerImport } from "../api";
import type { CustomerImportJob, ImportFailure } from "../types";

const maximumFileBytes = 10 * 1024 * 1024;
const acceptedTypes = new Set(["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const acceptedExtensions = /\.(csv|xlsx)$/i;
const terminal = new Set(["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"]);
const sessionKey = () => { const identity = getSessionIdentity(); return `${getSessionGeneration()}:${identity?.id ?? "anonymous"}:${JSON.stringify(identity?.company ?? null)}:${identity?.roles.join(",") ?? ""}`; };
const safeFile = (file: File) => file.size <= maximumFileBytes && (acceptedTypes.has(file.type) || (file.type === "" && acceptedExtensions.test(file.name)));

export function useCustomerImport() {
  const [file, setFile] = useState<File | null>(null); const [templateVersion, setTemplateVersion] = useState<string | null>(null); const [partialAcceptance, setPartialAcceptance] = useState(true);
  const [job, setJob] = useState<CustomerImportJob | null>(null); const [loadingTemplate, setLoadingTemplate] = useState(false); const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ImportFailure | null>(null); const [forbidden, setForbidden] = useState(false); const keyRef = useRef(sessionKey()); const requestRef = useRef(0); const submitRef = useRef(false);
  const clear = useCallback(() => { requestRef.current += 1; submitRef.current = false; setFile(null); setTemplateVersion(null); setJob(null); setError(null); setForbidden(false); setLoadingTemplate(false); setSubmitting(false); }, []);
  const fail = useCallback((status: number, correlationId: string | null) => { if (status === 401 || status === 403) { clear(); setForbidden(true); } else setError({ status, correlationId }); }, [clear]);
  useEffect(() => subscribeToSession(() => { const next = sessionKey(); if (next !== keyRef.current) { keyRef.current = next; clear(); } }), [clear]);
  useEffect(() => {
    if (job === null || terminal.has(job.status)) return;
    const current = ++requestRef.current;
    const timer = window.setTimeout(() => { void getCustomerImport(job.id).then((result) => { if (current !== requestRef.current) return; if (result.response.status === 200 && result.job) { setJob(result.job); setError(null); } else fail(result.response.status, result.correlationId); }).catch((reason) => { if (current === requestRef.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null }); }); }, 2000);
    return () => window.clearTimeout(timer);
  }, [job, fail]);
  const selectFile = (next: File | null) => { setError(null); if (next !== null && !safeFile(next)) { setFile(null); setError({ status: 415, correlationId: null }); return; } setFile(next); };
  const downloadTemplate = async () => { if (loadingTemplate) return; setLoadingTemplate(true); setError(null); try { const result = await downloadCustomerImportTemplate(); if (result.response.status !== 200 || !result.blob || !result.templateVersion) { fail(result.response.status, result.correlationId); return; } const url = URL.createObjectURL(result.blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = result.response.headers.get("Content-Type")?.includes("sheet") ? "plantilla-clientes.xlsx" : "plantilla-clientes.csv"; anchor.click(); URL.revokeObjectURL(url); setTemplateVersion(result.templateVersion); } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null }); } finally { setLoadingTemplate(false); } };
  const submit = async () => { if (submitting || submitRef.current || !file || !templateVersion) return; submitRef.current = true; setSubmitting(true); setError(null); const idempotencyKey = crypto.randomUUID(); try { const result = await createCustomerImport({ file, templateVersion, partialAcceptance, idempotencyKey }); if (result.response.status === 202 && result.job) { setJob(result.job); setFile(null); } else fail(result.response.status, result.correlationId); } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null }); } finally { submitRef.current = false; setSubmitting(false); } };
  return { file, templateVersion, partialAcceptance, job, loadingTemplate, submitting, polling: job !== null && !terminal.has(job.status), error, forbidden, selectFile, setPartialAcceptance, downloadTemplate, submit, retry: () => { setError(null); setForbidden(false); } };
}
