import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { navigate } from '../../../app/navigation'
import { login, type LoginResult } from '../auth'

type FieldErrors = {
  identifier?: string
  password?: string
}

function validateCredentials(identifier: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  const normalizedIdentifier = identifier.trim()

  if (normalizedIdentifier.length < 3 || normalizedIdentifier.length > 254) {
    errors.identifier = 'Ingresa un correo electrónico o usuario válido.'
  }
  if (password.length < 8 || password.length > 200) {
    errors.password = 'La contraseña debe tener entre 8 y 200 caracteres.'
  }
  return errors
}

export function useLoginForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (retryAfterSeconds === null) return
    const timer = window.setTimeout(() => {
      setRetryAfterSeconds((seconds) => seconds === null || seconds <= 1 ? null : seconds - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [retryAfterSeconds])

  const closeError = useCallback(() => setError(null), [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current) return

    const validationErrors = validateCredentials(identifier, password)
    setFieldErrors(validationErrors)
    setError(null)
    if (Object.keys(validationErrors).length > 0 || retryAfterSeconds !== null) return

    submittingRef.current = true
    setIsSubmitting(true)
    let result: LoginResult
    try {
      result = await login({ identifier: identifier.trim(), password })
    } catch {
      result = { ok: false, message: 'No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.', retryAfterSeconds: null }
    } finally {
      setPassword('')
      submittingRef.current = false
      setIsSubmitting(false)
    }

    if (result.ok) {
      navigate(result.redirectTo)
      return
    }

    setError(result.message)
    setRetryAfterSeconds(result.retryAfterSeconds)
  }

  return {
    identifier,
    password,
    showPassword,
    fieldErrors,
    error,
    isSubmitting,
    retryAfterSeconds,
    setIdentifier,
    setPassword,
    setShowPassword,
    closeError,
    handleSubmit,
  }
}
