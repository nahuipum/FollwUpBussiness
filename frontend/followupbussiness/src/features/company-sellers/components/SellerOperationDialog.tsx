import { CheckCircle2, X, XCircle } from "lucide-react";
import { ModalSurface } from "../../../shared/ui/ModalSurface";

export function SellerOperationDialog({ tone, message, onClose }: { tone: "success" | "error"; message: string; onClose: () => void }) {
  const success = tone === "success";
  return <ModalSurface titleId="seller-operation-title" onDismiss={onClose} className="seller-list__dialog seller-list__operation-dialog">
    <header className="seller-list__operation-close"><button type="button" aria-label="Cerrar mensaje" onClick={onClose}><X aria-hidden="true" /></button></header>
    <section className="seller-list__operation-content"><span className={`seller-list__operation-icon seller-list__operation-icon--${success ? "success" : "error"}`}>{success ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}</span><h2 id="seller-operation-title">{success ? "Vendedor actualizado" : "No pudimos actualizar el vendedor"}</h2><p role={success ? "status" : "alert"}>{message}</p></section>
    <footer><button className="seller-list__primary" type="button" onClick={onClose}>Aceptar</button></footer>
  </ModalSurface>;
}
