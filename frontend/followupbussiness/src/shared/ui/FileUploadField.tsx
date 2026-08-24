import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useId, useRef } from "react";
import "./file-upload-field.css";

type FileUploadFieldProps = {
  accept: string;
  file: File | null;
  label: string;
  hint: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

/** A branded file picker that keeps the native input available to assistive technology. */
export function FileUploadField({ accept, file, label, hint, onChange, disabled = false }: FileUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const chooseFile = () => inputRef.current?.click();

  return <div className="file-upload-field">
    <input ref={inputRef} id={inputId} className="file-upload-field__input" type="file" accept={accept} disabled={disabled} onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
    <div className="file-upload-field__icon" aria-hidden="true"><FileSpreadsheet /></div>
    <div className="file-upload-field__content">
      <strong>{file ? file.name : label}</strong>
      <span>{file ? formatFileSize(file.size) : hint}</span>
    </div>
    {file ? <button className="file-upload-field__clear" type="button" onClick={() => { if (inputRef.current) inputRef.current.value = ""; onChange(null); }} disabled={disabled} aria-label="Quitar archivo seleccionado"><X aria-hidden="true" /></button>
      : <button className="file-upload-field__choose" type="button" onClick={chooseFile} disabled={disabled}><Upload aria-hidden="true" />Seleccionar archivo</button>}
  </div>;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}
