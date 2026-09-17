import type { ReactNode } from "react";
import "./filter-field.css";

export function FilterField({
  label,
  children,
  layout = "stacked",
}: {
  label: string;
  children: ReactNode;
  layout?: "stacked" | "inline";
}) {
  return (
    <div
      className={`filter-field filter-field--${layout}`}
      data-ui="filter-field"
    >
      <span>{label}</span>
      {children}
    </div>
  );
}
