import "./read-only-notice.css";
import { Eye } from "lucide-react";

export function ReadOnlyNotice({ variant = "default", title = "Vista de solo lectura", description = "Puedes consultar el listado, aplicar filtros y cambiar de página. La gestión de accesos corresponde a una persona administradora." }: { variant?: "default" | "golden" | "scope"; title?: string; description?: string }) {
  if (variant !== "default") return <aside className={`read-only-notice read-only-notice--golden${variant === "scope" ? " read-only-notice--scope" : ""}`} role="status"><Eye aria-hidden="true" /><div><strong>{title}</strong><p>{description}</p></div></aside>;
  return <p className="read-only-notice read-only-notice--default">Solo lectura: no puedes realizar cambios en esta sección.</p>;
}
