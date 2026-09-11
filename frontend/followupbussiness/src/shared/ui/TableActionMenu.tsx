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
      onKeyDown={onKeyDown}
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
