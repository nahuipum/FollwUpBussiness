import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import "./date-filter-field.css";

const calendarWidth = 304;
const weekdays = ["L", "M", "X", "J", "V", "S", "D"];

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
    ? null
    : date;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function moveMonth(date: Date, amount: number) {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

const monthFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "long",
  year: "numeric",
});
const valueFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const accessibleFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatMonth(date: Date) {
  const value = monthFormatter.format(date);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeTime(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

function isValidTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return Boolean(match && Number(match[1]) < 24 && Number(match[2]) < 60);
}

export function DateFilterField({
  label,
  value,
  onValueChange,
  disabled = false,
  withTime = false,
  required = false,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  /** Combines the shared calendar with a local hour selector under one field label. */
  withTime?: boolean;
  required?: boolean;
}) {
  const dateValue = withTime ? value.slice(0, 10) : value;
  const timeValue = withTime ? value.slice(11, 16) : "";
  const selected = parseIsoDate(dateValue);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => selected ?? new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [focusedDate, setFocusedDate] = useState(() =>
    toIsoDate(selected ?? today),
  );
  const [pendingDate, setPendingDate] = useState(dateValue);
  const [pendingTime, setPendingTime] = useState(timeValue);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const dialogId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !triggerRef.current?.contains(event.target) &&
        !popoverRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const day = popoverRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${focusedDate}"]`,
    );
    day?.focus();
  }, [focusedDate, open, visibleMonth]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const bounds = triggerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const width = Math.min(calendarWidth, window.innerWidth - 24);
      const estimatedHeight = withTime ? 424 : 354;
      const below = bounds.bottom + 8;
      const top =
        below + estimatedHeight <= window.innerHeight
          ? below
          : Math.max(12, bounds.top - estimatedHeight - 8);
      setPosition({
        top,
        left: Math.max(
          12,
          Math.min(bounds.right - width, window.innerWidth - width - 12),
        ),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, withTime]);

  const openCalendar = () => {
    const initial = selected ?? today;
    setVisibleMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setFocusedDate(toIsoDate(initial));
    setPendingDate(dateValue);
    setPendingTime(timeValue);
    setOpen(true);
  };

  const choose = (date: Date) => {
    const nextDate = toIsoDate(date);
    if (withTime) {
      setFocusedDate(nextDate);
      setPendingDate(nextDate);
      return;
    }
    onValueChange(nextDate);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const applyDateTime = () => {
    if (!pendingDate || !isValidTime(pendingTime)) return;
    onValueChange(`${pendingDate}T${pendingTime}`);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const focus = (date: Date) => {
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setFocusedDate(toIsoDate(date));
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = parseIsoDate(focusedDate) ?? today;
    const moves: Partial<Record<string, Date>> = {
      ArrowLeft: addDays(current, -1),
      ArrowRight: addDays(current, 1),
      ArrowUp: addDays(current, -7),
      ArrowDown: addDays(current, 7),
      PageUp: moveMonth(current, -1),
      PageDown: moveMonth(current, 1),
    };
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    focus(next);
  };

  const days = calendarDays(visibleMonth);
  const selectedIso = withTime && open ? pendingDate || null : selected ? toIsoDate(selected) : null;
  const todayIso = toIsoDate(today);

  return (
    <div className={`filter-field date-filter${withTime ? " date-filter--with-time" : ""}`}>
      <span id={labelId}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        className="date-filter__trigger"
        aria-labelledby={labelId}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openCalendar())}
      >
        <span className={selected ? "" : "date-filter__placeholder"}>
          {selected
            ? `${valueFormatter.format(selected)}${withTime ? ` · ${timeValue || "--:--"}` : ""}`
            : withTime
              ? "dd/mm/aaaa · hh:mm"
              : "dd/mm/aaaa"}
        </span>
        <CalendarDays aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={dialogId}
            className="date-filter__popover"
            role="dialog"
            aria-modal="false"
            aria-label={`Calendario de ${label}`}
            style={position}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            <header className="date-filter__header">
              <strong>{formatMonth(visibleMonth)}</strong>
              <div>
                <button
                  type="button"
                  aria-label="Mes anterior"
                  onClick={() => focus(moveMonth(parseIsoDate(focusedDate) ?? today, -1))}
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Mes siguiente"
                  onClick={() => focus(moveMonth(parseIsoDate(focusedDate) ?? today, 1))}
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            </header>
            <div className="date-filter__weekdays" aria-hidden="true">
              {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
            </div>
            <div
              className={`date-filter__days${selectedIso ? " date-filter__days--has-selection" : ""}`}
            >
              {days.map((date) => {
                const iso = toIsoDate(date);
                const outside = date.getMonth() !== visibleMonth.getMonth();
                return (
                  <button
                    key={iso}
                    type="button"
                    data-date={iso}
                    className={outside ? "date-filter__day--outside" : undefined}
                    aria-label={accessibleFormatter.format(date)}
                    aria-current={iso === todayIso ? "date" : undefined}
                    aria-pressed={iso === selectedIso}
                    tabIndex={iso === focusedDate ? 0 : -1}
                    onFocus={() => setFocusedDate(iso)}
                    onKeyDown={handleDayKeyDown}
                    onClick={() => choose(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            {withTime && (
              <label className="date-filter__time-picker">
                Hora
                <input
                  type="text"
                  value={pendingTime}
                  required={required}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={pendingTime.length > 0 && !isValidTime(pendingTime)}
                  placeholder="HH:MM"
                  onChange={(event) => setPendingTime(normalizeTime(event.target.value))}
                />
              </label>
            )}
            <footer className="date-filter__footer">
              <button
                type="button"
                disabled={!value}
                onClick={() => {
                  onValueChange("");
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                Borrar
              </button>
              <button type="button" onClick={() => choose(today)}>Hoy</button>
              {withTime && <button type="button" className="date-filter__apply" disabled={!pendingDate || !isValidTime(pendingTime)} onClick={applyDateTime}>Aplicar</button>}
            </footer>
          </div>,
          document.body,
        )}
    </div>
  );
}
