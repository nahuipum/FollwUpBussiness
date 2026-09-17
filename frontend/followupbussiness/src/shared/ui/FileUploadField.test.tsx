import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { FileUploadField } from "./FileUploadField";

const props = { label: "Elige un archivo para importar", hint: "CSV UTF-8 o XLSX · Máximo 10 MiB", accept: ".csv,.xlsx" };
afterEach(cleanup);

test("mantiene el input nativo etiquetado y selecciona un archivo", () => {
  const onChange = vi.fn();
  render(<FileUploadField {...props} file={null} onChange={onChange} />);
  const input = screen.getByLabelText(props.label) as HTMLInputElement;
  const file = new File(["id,nombre"], "clientes.csv", { type: "text/csv" });
  fireEvent.change(input, { target: { files: [file] } });
  expect(input.accept).toBe(".csv,.xlsx");
  expect(onChange).toHaveBeenCalledWith(file);
});

test("muestra nombre completo accesible, tipo y tamaño sin romper el control", () => {
  const name = "clientes-lima-norte-septiembre-version-final-corregida.xlsx";
  const file = new File([new Uint8Array(6_710_886)], name, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  render(<FileUploadField {...props} file={file} onChange={vi.fn()} />);
  expect(screen.getByLabelText(`Archivo seleccionado: ${name}`).getAttribute("title")).toBe(name);
  expect(screen.getByText("XLSX sin macros")).toBeTruthy();
  expect(screen.getByRole("button", { name: `Quitar archivo seleccionado: ${name}` })).toBeTruthy();
});

test("asocia el error y expone aria-invalid", () => {
  render(<FileUploadField {...props} file={null} onChange={vi.fn()} error="La extensión no está permitida." />);
  const input = screen.getByLabelText(props.label);
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(input.getAttribute("aria-describedby")).toContain(screen.getByRole("alert").id);
});

test("quita el archivo, limpia el input y devuelve el foco", () => {
  const onChange = vi.fn();
  const file = new File(["x"], "clientes.csv", { type: "text/csv" });
  render(<FileUploadField {...props} file={file} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: /Quitar archivo seleccionado/ }));
  expect(onChange).toHaveBeenLastCalledWith(null);
  expect(document.activeElement).toBe(screen.getByLabelText(props.label));
});

test("deshabilita selección y retiro durante el envío", () => {
  const { rerender } = render(<FileUploadField {...props} file={null} onChange={vi.fn()} disabled />);
  expect((screen.getByLabelText(props.label) as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Seleccionar archivo" }) as HTMLButtonElement).disabled).toBe(true);
  rerender(<FileUploadField {...props} file={new File(["x"], "clientes.csv", { type: "text/csv" })} onChange={vi.fn()} disabled />);
  expect((screen.getByRole("button", { name: /Quitar archivo seleccionado/ }) as HTMLButtonElement).disabled).toBe(true);
});
