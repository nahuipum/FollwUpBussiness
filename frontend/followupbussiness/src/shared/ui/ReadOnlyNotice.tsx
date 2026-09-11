import "./read-only-notice.css";
import { Eye } from "lucide-react";

export function ReadOnlyNotice({ variant = "default" }: { variant?: "default" | "golden" }) {
  if (variant === "golden") return <aside className="read-only-notice read-only-notice--golden" role="status"><Eye aria-hidden="true" /><div><strong>Vista de solo lectura</strong><p>Puedes consultar el listado, aplicar filtros y cambiar de página. La gestión de accesos corresponde a una persona administradora.</p></div></aside>;
  return <p className="read-only-notice read-only-notice--default">Solo lectura: no puedes realizar cambios en esta sección.</p>;
}
