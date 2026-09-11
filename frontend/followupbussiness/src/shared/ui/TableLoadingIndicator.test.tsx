import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { TableLoadingIndicator } from "./TableLoadingIndicator";

afterEach(cleanup);

test("conserva spinner default y expone skeleton golden de cinco filas", () => {
  const { rerender } = render(<TableLoadingIndicator label="Cargando tabla" />);
  expect(screen.getByRole("status", { name: "Cargando tabla" }).className).toContain("table-loading-indicator--default");
  expect(screen.getByRole("status").querySelector("svg")).not.toBeNull();
  rerender(<TableLoadingIndicator label="Cargando tabla" variant="golden" />);
  expect(screen.getByRole("status").querySelectorAll(".table-loading-indicator__skeleton span")).toHaveLength(5);
});
