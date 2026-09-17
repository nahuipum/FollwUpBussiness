import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { createCustomerImport, downloadCustomerImportTemplate, getCustomerImportTemplateVersion } from "../api";
import type { CustomerImportJob, FileValidationFailure, ImportFailure, TemplateFailure } from "../types";

const maximumFileBytes = 10 * 1024 * 1024;
const csvType = "text/csv";
const xlsxType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const sessionKey = () => {
  const identity = getSessionIdentity();
  return `${getSessionGeneration()}:${identity?.id ?? "anonymous"}:${JSON.stringify(identity?.company ?? null)}:${identity?.roles.join(",") ?? ""}`;
};

export function validateCustomerImportFile(file: File): FileValidationFailure | null {
  if (file.size > maximumFileBytes) return { status: 413, code: "TOO_LARGE" };
  if (/\.xlsm$/i.test(file.name)) return { status: 415, code: "MACROS_NOT_ALLOWED" };
  const extension = /\.([^.]+)$/.exec(file.name)?.[1]?.toLowerCase() ?? "";
  if (extension !== "csv" && extension !== "xlsx") return { status: 415, code: "INVALID_EXTENSION" };
  if (file.type === "") return null;
  if (extension === "csv" && file.type !== csvType) return { status: 415, code: "INVALID_MIME" };
  if (extension === "xlsx" && file.type !== xlsxType) return { status: 415, code: "INVALID_MIME" };
  return null;
}

export function useCustomerImport() {
  const [file, setFile] = useState<File | null>(null); const [templateVersion, setTemplateVersion] = useState<string | null>(null); const [partialAcceptance, setPartialAcceptance] = useState(true);
  const [job, setJob] = useState<CustomerImportJob | null>(null); const [loadingTemplate, setLoadingTemplate] = useState(false); const [checkingTemplateVersion, setCheckingTemplateVersion] = useState(true); const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ImportFailure | null>(null); const [fileError, setFileError] = useState<FileValidationFailure | null>(null); const [templateFailure, setTemplateFailure] = useState<TemplateFailure | null>(null); const [templateDownloaded, setTemplateDownloaded] = useState(false); const [fileRemoved, setFileRemoved] = useState(false); const [forbidden, setForbidden] = useState(false);
  const keyRef = useRef(sessionKey()); const requestRef = useRef(0); const versionRequestRef = useRef(0); const downloadRequestRef = useRef(0); const submitRef = useRef(false); const downloadRef = useRef(false); const idempotencyKeyRef = useRef<string | null>(null);
  const clear = useCallback(() => { requestRef.current += 1; versionRequestRef.current += 1; downloadRequestRef.current += 1; submitRef.current = false; downloadRef.current = false; idempotencyKeyRef.current = null; setFile(null); setTemplateVersion(null); setPartialAcceptance(true); setJob(null); setError(null); setFileError(null); setTemplateFailure(null); setTemplateDownloaded(false); setFileRemoved(false); setForbidden(false); setLoadingTemplate(false); setCheckingTemplateVersion(false); setSubmitting(false); }, []);
  const forbid = useCallback(() => { clear(); setForbidden(true); }, [clear]);
  const refreshTemplateVersion = useCallback(async () => { const current = ++versionRequestRef.current; setCheckingTemplateVersion(true); setTemplateFailure(null); setTemplateDownloaded(false); try { const result = await getCustomerImportTemplateVersion(); if (current !== versionRequestRef.current) return; if (result.response.status === 401 || result.response.status === 403) { forbid(); return; } if (result.response.status === 200 && result.templateVersion) { setTemplateVersion(result.templateVersion); return; } setTemplateVersion(null); setTemplateFailure({ operation: "check", status: result.response.status, correlationId: result.correlationId }); } catch (reason) { if (current === versionRequestRef.current && !(reason instanceof ApiRequestObsoleteError)) { setTemplateVersion(null); setTemplateFailure({ operation: "check", status: 500, correlationId: null }); } } finally { if (current === versionRequestRef.current) setCheckingTemplateVersion(false); } }, [forbid]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicia la consulta asíncrona al montar el hook.
    void refreshTemplateVersion();
  }, [refreshTemplateVersion]);
  useEffect(
    () =>
      subscribeToSession(() => {
        const next = sessionKey();
        if (next === keyRef.current) return;

        keyRef.current = next;
        clear();
        const identity = getSessionIdentity();
        if (identity?.roles.includes("COMPANY_ADMIN")) {
          void refreshTemplateVersion();
        } else {
          setForbidden(true);
        }
      }),
    [clear, refreshTemplateVersion],
  );
  useEffect(() => () => { requestRef.current += 1; versionRequestRef.current += 1; downloadRequestRef.current += 1; submitRef.current = false; downloadRef.current = false; }, []);
  const selectFile = (next: File | null) => { if (submitRef.current) return; setError(null); setFileRemoved(next === null); idempotencyKeyRef.current = null; if (next !== null) { const validation = validateCustomerImportFile(next); if (validation !== null) { setFile(null); setFileError(validation); return; } } setFileError(null); setFile(next); };
  const updatePartialAcceptance = (next: boolean) => { if (submitRef.current) return; idempotencyKeyRef.current = null; setPartialAcceptance(next); };
  const downloadTemplate = async () => { if (downloadRef.current) return; downloadRef.current = true; const current = ++downloadRequestRef.current; setLoadingTemplate(true); setTemplateFailure(null); setTemplateDownloaded(false); try { const result = await downloadCustomerImportTemplate(); if (current !== downloadRequestRef.current) return; if (result.response.status === 401 || result.response.status === 403) { forbid(); return; } if (result.response.status !== 200 || !result.blob || !result.templateVersion) { setTemplateFailure({ operation: "download", status: result.response.status, correlationId: result.correlationId }); return; } const url = URL.createObjectURL(result.blob); try { const anchor = document.createElement("a"); anchor.href = url; anchor.download = result.response.headers.get("Content-Type")?.includes("sheet") ? "plantilla-clientes.xlsx" : "plantilla-clientes.csv"; anchor.click(); } finally { URL.revokeObjectURL(url); } idempotencyKeyRef.current = null; setTemplateVersion(result.templateVersion); setTemplateDownloaded(true); } catch (reason) { if (current === downloadRequestRef.current && !(reason instanceof ApiRequestObsoleteError)) setTemplateFailure({ operation: "download", status: 500, correlationId: null }); } finally { if (current === downloadRequestRef.current) { downloadRef.current = false; setLoadingTemplate(false); } } };
  const submit = async () => { if (submitRef.current || !file || !templateVersion || checkingTemplateVersion || fileError !== null) return; submitRef.current = true; const current = ++requestRef.current; setSubmitting(true); setError(null); idempotencyKeyRef.current ??= crypto.randomUUID(); const idempotencyKey = idempotencyKeyRef.current; try { const result = await createCustomerImport({ file, templateVersion, partialAcceptance, idempotencyKey }); if (current !== requestRef.current) return; if (result.response.status === 401 || result.response.status === 403) { forbid(); return; } if (result.response.status === 202 && result.job) { idempotencyKeyRef.current = null; setJob(result.job); setFile(null); } else setError({ status: result.response.status === 202 ? 500 : result.response.status, correlationId: result.correlationId }); } catch (reason) { if (current === requestRef.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null }); } finally { if (current === requestRef.current) { submitRef.current = false; setSubmitting(false); } } };
  return { file, templateVersion, partialAcceptance, job, loadingTemplate, checkingTemplateVersion, submitting, error, fileError, templateFailure, templateDownloaded, fileRemoved, forbidden, selectFile, setPartialAcceptance: updatePartialAcceptance, downloadTemplate, refreshTemplateVersion, submit, dismissError: () => setError(null) };
}
