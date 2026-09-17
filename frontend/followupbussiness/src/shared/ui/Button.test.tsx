import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { Button } from "./Button";

test("expone las variantes golden sin alterar la semántica de botón", () => {
  const onClick = vi.fn();
  render(<Button variant="primary" size="compact" onClick={onClick}>Continuar</Button>);
  const button = screen.getByRole("button", { name: "Continuar" });
  expect(button.className).toContain("shared-button--primary");
  expect(button.className).toContain("shared-button--compact");
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
});
