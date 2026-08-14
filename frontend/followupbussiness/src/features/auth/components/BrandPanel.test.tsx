import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { BrandPanel } from "./BrandPanel";

const initialInnerWidth = window.innerWidth;

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
}

afterEach(() => {
  setViewportWidth(initialInnerWidth);
});

test("does not render the brand panel at widths of 900px or less", () => {
  setViewportWidth(900);

  render(<BrandPanel />);

  expect(screen.queryByLabelText("FollowUpBusiness")).toBeNull();
});

test("renders the brand panel above 900px and removes it after resizing down", () => {
  setViewportWidth(901);
  render(<BrandPanel />);

  expect(screen.queryByLabelText("FollowUpBusiness")).not.toBeNull();

  act(() => {
    setViewportWidth(900);
    window.dispatchEvent(new Event("resize"));
  });

  expect(screen.queryByLabelText("FollowUpBusiness")).toBeNull();
});
