import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { BrandPanel } from "./BrandPanel";

const initialInnerWidth = window.innerWidth;

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
}

afterEach(() => {
  cleanup();
  setViewportWidth(initialInnerWidth);
  delete document.documentElement.dataset.theme;
});

test("uses the dark logo without a white plate and updates with the theme", async () => {
  setViewportWidth(621);
  document.documentElement.dataset.theme = "dark";
  render(<BrandPanel />);

  const logo = screen.getByRole("img", { name: "followUp Business" });
  expect(logo.getAttribute("src")).toContain("followup-logo-obscure-v2.png");

  act(() => {
    document.documentElement.dataset.theme = "light";
  });

  await waitFor(() => {
    expect(logo.getAttribute("src")).toContain("followup-logo.png");
  });
});

test("does not render the approved brand panel at widths of 620px or less", () => {
  setViewportWidth(620);

  render(<BrandPanel />);

  expect(screen.queryByLabelText("Presentación de followUp Business")).toBeNull();
});

test("renders the approved brand panel above 620px and removes it after resizing down", () => {
  setViewportWidth(621);
  render(<BrandPanel />);

  expect(screen.queryByLabelText("Presentación de followUp Business")).not.toBeNull();
  expect(screen.getByRole("img", { name: "followUp Business" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Cada seguimiento, en el momento justo." })).toBeTruthy();
  expect(screen.getByText("Conecta a tu equipo con las oportunidades que mueven tu negocio.")).toBeTruthy();

  act(() => {
    setViewportWidth(620);
    window.dispatchEvent(new Event("resize"));
  });

  expect(screen.queryByLabelText("Presentación de followUp Business")).toBeNull();
});
