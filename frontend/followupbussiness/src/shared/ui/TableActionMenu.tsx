import {
  useEffect,
  useRef,
  type KeyboardEventHandler,
  type ReactNode,
  type RefObject,
} from "react";
import { FloatingMenu } from "./FloatingMenu";
import "./table-action-menu.css";

export type TableAction = Readonly<{
  label: string;
  icon: ReactNode;
  tone?: "default" | "danger";
  onSelect: () => void;
}>;

export function TableActionMenu({
  anchor,
  ariaLabel,
  items,
  menuRef,
  onKeyDown,
  onDismiss,
  variant = "default",
}: {
  anchor: HTMLElement | null;
  ariaLabel: string;
  items: readonly TableAction[];
  menuRef?: RefObject<HTMLDivElement | null> | undefined;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement> | undefined;
  onDismiss?: (() => void) | undefined;
  variant?: "default" | "golden";
}) {
  const internalRef = useRef<HTMLDivElement>(null);
  const activeRef = menuRef ?? internalRef;
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onDismiss?.();
      anchor?.focus();
      return;
    }
    const items = Array.from(activeRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(Math.max(current, 0) + step + items.length) % items.length]?.focus();
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      items[event.key === "Home" ? 0 : items.length - 1]?.focus();
      return;
    }
    onKeyDown?.(event);
  };
  useEffect(() => {
    activeRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [activeRef]);
  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !activeRef.current?.contains(event.target) &&
        !anchor?.contains(event.target)
      )
        onDismiss?.();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [activeRef, anchor, onDismiss]);
  return (
    <FloatingMenu
      anchor={anchor}
      menuRef={activeRef}
      className={`table-action-menu table-action-menu--${variant}`}
      ariaLabel={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={
            item.tone === "danger" ? "table-action-menu__danger" : undefined
          }
          onClick={item.onSelect}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </FloatingMenu>
  );
}
