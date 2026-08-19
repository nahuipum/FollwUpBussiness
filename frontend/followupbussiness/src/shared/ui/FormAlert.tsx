import type { ReactNode } from "react";
import "./form-alert.css";

export function FormAlert({ children }: { children: ReactNode }) {
  return <div className="form-alert" role="alert">{children}</div>;
}
