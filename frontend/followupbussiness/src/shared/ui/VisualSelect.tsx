import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import "./visual-select.css";

export type VisualSelectOption<T extends string> = Readonly<{
  value: T;
  label: string;
  disabled?: boolean;
}>;

type Props<T extends string> = {
  value: T;
  options: readonly VisualSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  invalid?: boolean;
};

export function VisualSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  invalid = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const choose = (option: VisualSelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="visual-select">
      <button
        type="button"
        className="visual-select__trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selected?.label}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div
          id={listboxId}
          className="visual-select__menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              onClick={() => choose(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
