import { useEffect, useEffectEvent, useRef, type RefObject } from 'react'

const focusableSelector = 'button, [href], input, select, textarea, [tabindex]'

function focusableElements(dialog: HTMLElement | null) {
  return dialog ? [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => !element.hasAttribute('disabled') && element.tabIndex >= 0) : []
}

export function useDialogFocus(onDismiss: () => void, initialFocusRef?: RefObject<HTMLElement | null>, dismissOnEscape = true) {
  const dialogRef = useRef<HTMLElement>(null)
  const fallbackInitialFocusRef = useRef<HTMLButtonElement>(null)
  const dismiss = useEffectEvent(onDismiss)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = focusableElements(dialogRef.current)
    ;(initialFocusRef?.current ?? fallbackInitialFocusRef.current ?? focusable[0] ?? dialogRef.current)?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!dismissOnEscape) return
        event.preventDefault()
        dismiss()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = focusableElements(dialogRef.current)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [dismissOnEscape, initialFocusRef])

  return { dialogRef, initialFocusRef: fallbackInitialFocusRef }
}
