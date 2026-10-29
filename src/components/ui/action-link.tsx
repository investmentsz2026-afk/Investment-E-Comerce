"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { NavTarget } from "@/types/navigation";
import { useNotice } from "@/components/feedback/notice-provider";

interface ActionLinkProps {
  target: NavTarget;
  className?: string;
  children: ReactNode;
  /** Se ejecuta tras activar la acción (p. ej. cerrar un menú). */
  onActivate?: () => void;
  "aria-label"?: string;
}

/**
 * Renderiza un destino de navegación de forma honesta:
 * - href a páginas internas → <Link href="...">
 * - anclas a secciones existentes → <a href="#...">
 * - funcionalidades futuras → <button> que anuncia "Próximamente"
 * Así ningún enlace aparenta funcionar sin estar implementado.
 */
export function ActionLink({ target, className, children, onActivate, ...aria }: ActionLinkProps) {
  const { announcePending } = useNotice();

  if (target.kind === "href") {
    return (
      <Link href={target.href} className={className} onClick={onActivate} {...aria}>
        {children}
      </Link>
    );
  }

  if (target.kind === "anchor") {
    return (
      <a href={target.href} className={className} onClick={onActivate} {...aria}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      data-pending-feature={target.feature}
      onClick={() => {
        announcePending(target.feature);
        onActivate?.();
      }}
      {...aria}
    >
      {children}
    </button>
  );
}

