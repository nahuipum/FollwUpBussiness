import { OperationDialog } from "../../../shared/ui/OperationDialog";

export function SellerOperationDialog({ tone, title, message, onClose }: { tone: "success" | "error"; title?: string; message: string; onClose: () => void }) {
  return <OperationDialog titleId="seller-operation-title" tone={tone} title={title ?? (tone === "success" ? "Vendedor actualizado" : "No pudimos actualizar el vendedor")} message={message} onClose={onClose} />;
}
