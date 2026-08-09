import { CircleAlert } from 'lucide-react'
import { ModalDialog } from '../../../shared/ui/ModalDialog'

type AuthErrorDialogProps = {
  message: string
  onClose: () => void
}

export function AuthErrorDialog({ message, onClose }: AuthErrorDialogProps) {
  return <ModalDialog
    titleId="auth-error-title"
    title="Inicio de sesión fallido"
    description={message}
    icon={<CircleAlert />}
    primaryAction={{ label: 'Cerrar', onClick: onClose }}
    onDismiss={onClose}
  />
}
