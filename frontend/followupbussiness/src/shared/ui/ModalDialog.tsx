import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { useDialogFocus } from '../hooks/useDialogFocus'
import './modal-dialog.css'
import './modal-scrollbar.css'

type DialogAction = {
  label: string
  onClick: () => void
}

type ModalDialogProps = {
  titleId: string
  title: string
  description: string
  icon: ReactNode
  primaryAction: DialogAction
  secondaryAction?: DialogAction
  onDismiss: () => void
}

export function ModalDialog({ titleId, title, description, icon, primaryAction, secondaryAction, onDismiss }: ModalDialogProps) {
  const { dialogRef, initialFocusRef } = useDialogFocus(onDismiss)

  return createPortal(
    <div className="modal-layer">
      <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <span className="modal-icon" aria-hidden="true">{icon}</span>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
        <button ref={initialFocusRef} className="modal-primary" type="button" onClick={primaryAction.onClick}>{primaryAction.label}</button>
        {secondaryAction && <button className="modal-secondary" type="button" onClick={secondaryAction.onClick}>{secondaryAction.label}</button>}
      </section>
    </div>,
    document.body,
  )
}
