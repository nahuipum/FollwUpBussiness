import "./time-field.css";

function normalizeTime(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function TimeField({
  label,
  value,
  onValueChange,
  disabled = false,
  required = false,
  variant = "default",
  showClockIcon = false,
  describedBy,
  invalid = false,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  variant?: "default" | "golden";
  showClockIcon?: boolean;
  describedBy?: string;
  invalid?: boolean;
}) {
  const formatInvalid = value.length > 0 && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  return (
    <label className={`time-field time-field--${variant}`}>
      <span>{label}</span>
      <span className={showClockIcon ? "time-field__control time-field__control--with-icon" : undefined}>
        <input
          type="text"
          value={value}
          required={required}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="off"
          placeholder={variant === "golden" ? "--:--" : "HH:MM"}
          aria-invalid={invalid || formatInvalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => onValueChange(normalizeTime(event.target.value))}
        />
        {showClockIcon && <svg className="time-field__clock" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>}
      </span>
    </label>
  );
}
