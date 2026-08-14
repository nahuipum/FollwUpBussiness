import { useLayoutEffect, useState, type KeyboardEventHandler, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export function FloatingMenu({ anchor, menuRef, className, children, ariaLabel, onKeyDown, menuWidth = 264 }: { anchor: HTMLElement | null; menuRef?: RefObject<HTMLDivElement | null> | undefined; className: string; children: ReactNode; ariaLabel: string; onKeyDown?: KeyboardEventHandler<HTMLDivElement> | undefined; menuWidth?: number | undefined }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    if (!anchor) return;
    const update = () => {
      const bounds = anchor.getBoundingClientRect();
      setPosition({ top: bounds.bottom + 8, left: Math.max(12, Math.min(bounds.right - menuWidth, window.innerWidth - menuWidth - 12)) });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [anchor, menuWidth]);
  if (!anchor) return null;
  return createPortal(<div ref={menuRef} className={className} role="menu" aria-label={ariaLabel} onKeyDown={onKeyDown} style={{ position: "fixed", top: position.top, left: position.left, right: "auto", zIndex: 30 }}>{children}</div>, document.body);
}
