import { OperationDialog } from "../../../shared/ui/OperationDialog";

type AuthErrorDialogProps = {
  message: string;
  onClose: () => void;
};

export function AuthErrorDialog({ message, onClose }: AuthErrorDialogProps) {
  return (
    <OperationDialog
      titleId="auth-error-title"
      tone="error"
      title="Inicio de sesión fallido"
      message={message}
      primaryLabel="Cerrar"
      onClose={onClose}
      appearance="golden"
      showDismissButton={false}
    />
  );
}
