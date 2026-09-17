import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import "./button.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "secondary" | "primary" | "ghost" | "danger";
  size?: "default" | "compact";
  iconOnly?: boolean;
  leadingIcon?: ReactNode;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", size = "default", iconOnly = false, leadingIcon, className, type = "button", children, ...props },
  ref,
) {
  const classes = [
    "shared-button",
    `shared-button--${variant}`,
    size === "compact" && "shared-button--compact",
    iconOnly && "shared-button--icon",
    className,
  ].filter(Boolean).join(" ");

  return <button ref={ref} type={type} className={classes} {...props}>{leadingIcon}{children}</button>;
});
