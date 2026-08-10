import { ShieldX } from "lucide-react";
import { navigate } from "../../../app/navigation";
import { ModalDialog } from "../../../shared/ui/ModalDialog";

type InvalidSessionDialogProps = {
  onClose: () => void;
};

export function InvalidSessionDialog({ onClose }: InvalidSessionDialogProps) {
  return (
    <ModalDialog
      titleId="invalid-session-title"
      title="Sesión inválida"
      description="Tu sesión ya no es válida o ha expirado. Vuelve a iniciar sesión para continuar."
      icon={<ShieldX />}
      primaryAction={{
        label: "Ir al inicio de sesión",
        onClick: () => navigate("/"),
      }}
      secondaryAction={{ label: "Cerrar", onClick: onClose }}
      onDismiss={onClose}
    />
  );
}
