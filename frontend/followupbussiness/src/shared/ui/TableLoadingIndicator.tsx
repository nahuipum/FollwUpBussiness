import { LoaderCircle } from "lucide-react";
import type { CSSProperties } from "react";
import "./table-loading-indicator.css";

export function TableLoadingIndicator({ label, compact = false, variant = "default", columns = 1 }: { label: string; compact?: boolean; variant?: "default" | "golden"; columns?: number }) {
  const skeletonStyle = { "--table-loading-columns": columns } as CSSProperties;
  return <div className={`table-loading-indicator table-loading-indicator--${variant}${compact ? " table-loading-indicator--compact" : ""}`} role="status" aria-label={label} aria-busy="true">{variant === "golden" ? <div className="table-loading-indicator__skeleton" aria-hidden="true" style={skeletonStyle}>{Array.from({ length: 5 }, (_, row) => <div key={row}>{Array.from({ length: columns }, (_, column) => <span key={column} />)}</div>)}</div> : <LoaderCircle aria-hidden="true" />}<span>{label}</span></div>;
}
