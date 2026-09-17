import { useLayoutEffect, useState, type KeyboardEventHandler, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export function FloatingMenu({ anchor, menuRef, className, children, ariaLabel, onKeyDown, menuWidth = 264 }: { anchor: HTMLElement | null; menuRef?: RefObject<HTMLDivElement | null> | undefined; className: string; children: ReactNode; ariaLabel: string; onKeyDown?: KeyboardEventHandler<HTMLDivElement> | undefined; menuWidth?: number | undefined }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    if (!anchor) return;
    const update = () => {
      const bounds = anchor.getBoundingClientRect();
      const menuBounds = menuRef?.current?.getBoundingClientRect();
      const width = menuBounds?.width || Math.min(menuWidth, window.innerWidth - 24);
      const height = menuBounds?.height ?? 0;
      const spaceBelow = window.innerHeight - bounds.bottom - 12;
      const opensAbove = height > 0 && height > spaceBelow;
      setPosition({
        top: opensAbove
          ? Math.max(12, bounds.top - height - 8)
          : Math.min(bounds.bottom + 8, window.innerHeight - height - 12),
        left: Math.max(12, Math.min(bounds.right - width, window.innerWidth - width - 12)),
      });
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (menuRef?.current) observer?.observe(menuRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { observer?.disconnect(); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [anchor, menuRef, menuWidth]);
  if (!anchor) return null;
  return createPortal(<div ref={menuRef} className={className} role="menu" aria-label={ariaLabel} tabIndex={-1} onKeyDown={onKeyDown} style={{ position: "fixed", top: position.top, left: position.left, right: "auto", zIndex: 30 }}>{children}</div>, document.body);
}
