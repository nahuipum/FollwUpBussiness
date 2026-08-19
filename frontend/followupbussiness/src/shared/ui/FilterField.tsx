import type { ReactNode } from "react";
import "./filter-field.css";

export function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`filter-field ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </div>
  );
}
