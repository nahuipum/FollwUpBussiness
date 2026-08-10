import { useRef, useState, type FormEvent } from "react";
import { resetPassword, type PasswordResetResult } from "../passwordRecovery";

type FieldErrors = { newPassword?: string; confirmation?: string };

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function isValidPasswordResetToken(
  token: string | null,
): token is string {
  return token !== null && /^[A-Za-z0-9_-]{43}$/.test(token);
}

function validatePassword(
  newPassword: string,
  confirmation: string,
): FieldErrors {
  const errors: FieldErrors = {};
  const length = byteLength(newPassword);
  if (length < 8 || length > 72)
    errors.newPassword = "La contraseña debe tener entre 8 y 72 bytes.";
  if (confirmation !== newPassword)
    errors.confirmation = "Las contraseñas no coinciden.";
  return errors;
}

export function usePasswordResetForm(
  token: string | null,
  onSuccess: () => void,
  onTokenError: (
    reason: Extract<PasswordResetResult, { ok: false }>["reason"],
  ) => void,
) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const clearSensitiveState = () => {
    setNewPassword("");
    setConfirmation("");
    setShowNewPassword(false);
    setShowConfirmation(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!isValidPasswordResetToken(token)) {
      clearSensitiveState();
      onTokenError("invalid");
      return;
    }
    const errors = validatePassword(newPassword, confirmation);
    setFieldErrors(errors);
    setError(null);
    if (Object.keys(errors).length > 0) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    const result = await resetPassword(token, newPassword);
    submittingRef.current = false;
    setIsSubmitting(false);
    clearSensitiveState();
    if (result.ok) {
      onSuccess();
      return;
    }
    if (result.reason === "expired" || result.reason === "invalid") {
      onTokenError(result.reason);
      return;
    }
    setError(
      result.reason === "policy"
        ? "La nueva contraseña no cumple la política de seguridad. Elige otra contraseña."
        : "No pudimos restablecer la contraseña. Inténtalo nuevamente o solicita un nuevo enlace.",
    );
  };

  return {
    newPassword,
    setNewPassword,
    confirmation,
    setConfirmation,
    showNewPassword,
    setShowNewPassword,
    showConfirmation,
    setShowConfirmation,
    fieldErrors,
    error,
    isSubmitting,
    handleSubmit,
  };
}
