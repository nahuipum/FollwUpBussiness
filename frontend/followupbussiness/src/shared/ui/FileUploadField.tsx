import { BriefcaseBusiness, X } from "lucide-react";
import { useId, useRef } from "react";
import "./file-upload-field.css";

type FileUploadFieldProps = {
  accept: string;
  file: File | null;
  label: string;
  hint: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  error?: string | null;
  statusMessage?: string | null;
};

/** A branded file picker that keeps the native input available to assistive technology. */
export function FileUploadField({ accept, file, label, hint, onChange, disabled = false, error = null, statusMessage = null }: FileUploadFieldProps) {
  const inputId = useId();
  const labelId = `${inputId}-label`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const chooseFile = () => inputRef.current?.click();
  const removeFile = () => {
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
    inputRef.current?.focus();
  };

  return <div className="file-upload-field">
    <label id={labelId} className="file-upload-field__label" htmlFor={inputId}>{label}</label>
    <input ref={inputRef} id={inputId} className="file-upload-field__input" type="file" accept={accept} disabled={disabled} aria-labelledby={labelId} aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`} aria-invalid={error !== null} onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
    <div className={`file-upload-field__box${error ? " file-upload-field__box--error" : ""}${disabled ? " file-upload-field__box--disabled" : ""}`}>
      <div className="file-upload-field__icon" aria-hidden="true"><BriefcaseBusiness /></div>
      <div className="file-upload-field__content">
        <strong title={file?.name} {...(file ? { "aria-label": `Archivo seleccionado: ${file.name}` } : {})}>{file ? file.name : label}</strong>
        <span id={helpId}>{file ? <>{formatFileSize(file.size)} · <span className="file-upload-field__kind">{fileKind(file)}</span></> : hint}</span>
      </div>
      {file ? <button className="file-upload-field__clear" type="button" onClick={removeFile} disabled={disabled} aria-label={`Quitar archivo seleccionado: ${file.name}`}><X aria-hidden="true" /></button>
        : <button className="file-upload-field__choose" type="button" onClick={chooseFile} disabled={disabled}><BriefcaseBusiness aria-hidden="true" />Seleccionar archivo</button>}
    </div>
    {error && <p id={errorId} className="file-upload-field__message" role="alert">{error}</p>}
    {!error && statusMessage && <p className="file-upload-field__note" role="status">{statusMessage}</p>}
  </div>;
}

function fileKind(file: File) {
  return /\.xlsx$/i.test(file.name) ? "XLSX sin macros" : "CSV UTF-8";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}
