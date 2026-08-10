import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { requestPasswordRecovery } from "../passwordRecovery";

type FieldErrors = { email?: string };

function validateEmail(email: string): FieldErrors {
  const normalized = email.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    return { email: "Ingresa un correo electrónico válido." };
  }
  return {};
}

export function usePasswordRecoveryForm(onConfirmed: () => void) {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(
    null,
  );
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);
  const cooldownTimerRef = useRef<number | null>(null);
  const cooldownGenerationRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cooldownGenerationRef.current += 1;
      if (cooldownTimerRef.current !== null)
        window.clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const clearCooldown = useCallback(() => {
    cooldownGenerationRef.current += 1;
    if (cooldownTimerRef.current !== null) {
      window.clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    setRetryAfterSeconds(null);
  }, []);

  const startCooldown = useCallback(
    (seconds: number) => {
      clearCooldown();
      const generation = cooldownGenerationRef.current;
      const tick = (remaining: number) => {
        if (!mountedRef.current || generation !== cooldownGenerationRef.current)
          return;
        setRetryAfterSeconds(remaining);
        if (remaining <= 1) {
          cooldownTimerRef.current = null;
          setRetryAfterSeconds(null);
          return;
        }
        cooldownTimerRef.current = window.setTimeout(
          () => tick(remaining - 1),
          1000,
        );
      };
      tick(seconds);
    },
    [clearCooldown],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || retryAfterSeconds !== null) return;
    const errors = validateEmail(email);
    setFieldErrors(errors);
    clearCooldown();
    setError(null);
    if (Object.keys(errors).length > 0) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    const result = await requestPasswordRecovery(email.trim());
    if (!mountedRef.current) return;
    submittingRef.current = false;
    setIsSubmitting(false);
    if (result.ok) {
      setEmail("");
      onConfirmed();
      return;
    }
    if (result.reason === "rate-limited")
      startCooldown(result.retryAfterSeconds ?? 60);
    else clearCooldown();
    setError(
      result.reason === "rate-limited"
        ? "Ya estamos procesando una solicitud reciente. Espera antes de volver a intentarlo."
        : result.reason === "unavailable"
          ? "El servicio no está disponible temporalmente. Inténtalo más tarde."
          : "No pudimos procesar la solicitud. Inténtalo nuevamente.",
    );
  };

  return {
    email,
    setEmail,
    fieldErrors,
    error,
    isSubmitting,
    retryAfterSeconds,
    handleSubmit,
  };
}
