import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import "./filter-field.css";
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

function getOptionId(listboxId: string, index: number) {
  return `${listboxId}-option-${index}`;
}

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  const selectedEnabledIndex = options.findIndex(
    (option) => option.value === value && !option.disabled,
  );
  const firstEnabledIndex = options.findIndex((option) => !option.disabled);
  const lastEnabledIndex = options.findLastIndex((option) => !option.disabled);

  const initialIndex = (direction: "first" | "last" = "first") => {
    if (selectedEnabledIndex >= 0) return selectedEnabledIndex;
    return direction === "last" ? lastEnabledIndex : firstEnabledIndex;
  };

  const openMenu = (direction: "first" | "last" = "first") => {
    setActiveIndex(initialIndex(direction));
    setOpen(true);
  };

  const moveActive = (step: 1 | -1) => {
    const enabledIndexes = options.flatMap((option, index) =>
      option.disabled ? [] : [index],
    );
    if (enabledIndexes.length === 0) return;
    const currentPosition = enabledIndexes.indexOf(activeIndex);
    const nextPosition =
      currentPosition < 0
        ? step === 1
          ? 0
          : enabledIndexes.length - 1
        : (currentPosition + step + enabledIndexes.length) %
          enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextPosition] ?? -1);
  };

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const bounds = triggerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const viewportPadding = 12;
      const menuGap = 6;
      const width = Math.max(bounds.width, 112);
      const menuHeight = Math.min(320, options.length * 36 + 12);
      const spaceBelow = window.innerHeight - bounds.bottom - menuGap - viewportPadding;
      const spaceAbove = bounds.top - menuGap - viewportPadding;
      const opensUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      const availableSpace = Math.max(0, opensUpward ? spaceAbove : spaceBelow);
      setPosition({
        top: opensUpward
          ? Math.max(viewportPadding, bounds.top - menuGap - Math.min(menuHeight, availableSpace))
          : bounds.bottom + menuGap,
        left: Math.max(viewportPadding, Math.min(bounds.left, window.innerWidth - width - viewportPadding)),
        width,
        maxHeight: Math.min(menuHeight, availableSpace),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document
      .getElementById(getOptionId(listboxId, activeIndex))
      ?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, listboxId, open]);

  const choose = (option: VisualSelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="visual-select">
      <button
        ref={triggerRef}
        type="button"
        className="visual-select__trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        aria-activedescendant={
          open && activeIndex >= 0
            ? getOptionId(listboxId, activeIndex)
            : undefined
        }
        onClick={() => {
          if (open) setOpen(false);
          else openMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
            return;
          }
          if (event.key === "Tab") {
            setOpen(false);
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) openMenu();
            else if (activeIndex >= 0) {
              const option = options[activeIndex];
              if (option) choose(option);
            }
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open)
              openMenu(event.key === "ArrowUp" ? "last" : "first");
            else moveActive(event.key === "ArrowDown" ? 1 : -1);
            return;
          }
          if (open && (event.key === "Home" || event.key === "End")) {
            event.preventDefault();
            setActiveIndex(
              event.key === "Home" ? firstEnabledIndex : lastEnabledIndex,
            );
          }
        }}
      >
        <span>{selected?.label}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          className="visual-select__menu"
          role="listbox"
          aria-label={ariaLabel}
          style={position}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              id={getOptionId(listboxId, index)}
              type="button"
              role="option"
              aria-selected={option.value === value}
              data-active={index === activeIndex || undefined}
              disabled={option.disabled}
              tabIndex={-1}
              onPointerMove={() => {
                if (!option.disabled) setActiveIndex(index);
              }}
              onClick={() => choose(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      , document.body)}
    </div>
  );
}
