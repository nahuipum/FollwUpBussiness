import { LoaderCircle } from "lucide-react";
import "./table-loading-indicator.css";

export function TableLoadingIndicator({ label, compact = false }: { label: string; compact?: boolean }) {
  return <div className={`table-loading-indicator${compact ? " table-loading-indicator--compact" : ""}`} role="status" aria-label={label}><LoaderCircle aria-hidden="true" /><span>{label}</span></div>;
}
