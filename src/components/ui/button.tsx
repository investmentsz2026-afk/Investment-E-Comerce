import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "light" | "accent" | "outline" | "outline-light";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-3 overflow-hidden whitespace-nowrap font-sans text-[0.7rem] font-medium uppercase tracking-[0.18em] transition-[background-color,color,border-color,transform] duration-500 ease-luxe active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-cochinilla",
  light: "bg-paper text-ink hover:bg-bone",
  accent: "bg-cochinilla text-paper hover:bg-cochinilla-deep",
  outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  "outline-light": "border border-paper/35 text-paper hover:border-paper hover:bg-paper hover:text-ink",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-5",
  md: "h-12 px-7",
  lg: "h-14 px-9",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(base, variants[variant], sizes[size], className);
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icono final; se desplaza sutilmente al pasar el cursor. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };
type ButtonAsLink = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/** Contenido con efecto de texto rodante (solo transform). */
export function ButtonContent({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <>
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-luxe group-hover/btn:-translate-y-full">
          {children}
        </span>
        <span
          aria-hidden
          className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-luxe group-hover/btn:translate-y-0"
        >
          {children}
        </span>
      </span>
      {icon ? (
        <span className="flex transition-transform duration-500 ease-luxe group-hover/btn:translate-x-1" aria-hidden>
          {icon}
        </span>
      ) : null}
    </>
  );
}

function isLink(props: ButtonProps): props is ButtonAsLink {
  return typeof props.href === "string";
}

export function Button(props: ButtonProps) {
  if (isLink(props)) {
    const { variant, size, icon, className, children, ...anchorProps } = props;
    return (
      <a {...anchorProps} className={buttonClasses({ variant, size, className })}>
        <ButtonContent icon={icon}>{children}</ButtonContent>
      </a>
    );
  }

  const { variant, size, icon, className, children, type = "button", ...buttonProps } = props;
  return (
    <button {...buttonProps} type={type} className={buttonClasses({ variant, size, className })}>
      <ButtonContent icon={icon}>{children}</ButtonContent>
    </button>
  );
}
