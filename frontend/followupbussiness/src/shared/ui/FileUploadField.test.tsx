import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { FileUploadField } from "./FileUploadField";

test("muestra el archivo seleccionado y permite quitarlo", () => {
  const onChange = vi.fn();
  const { container, rerender } = render(<FileUploadField label="Elige un archivo" hint="CSV o XLSX" accept=".csv" file={null} onChange={onChange} />);
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["id,nombre"], "clientes.csv", { type: "text/csv" });

  fireEvent.change(input, { target: { files: [file] } });
  expect(onChange).toHaveBeenCalledWith(file);

  rerender(<FileUploadField label="Elige un archivo" hint="CSV o XLSX" accept=".csv" file={file} onChange={onChange} />);
  expect(screen.getByText("clientes.csv")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Quitar archivo seleccionado" }));
  expect(onChange).toHaveBeenLastCalledWith(null);
});
