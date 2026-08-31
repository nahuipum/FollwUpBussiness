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
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const invalid = value.length > 0 && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  return (
    <label className="time-field">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        required={required}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="off"
        placeholder="HH:MM"
        aria-invalid={invalid || undefined}
        onChange={(event) => onValueChange(normalizeTime(event.target.value))}
      />
    </label>
  );
}
