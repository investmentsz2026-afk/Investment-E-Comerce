"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AccountNavTabProps {
  href: string;
  icon: ReactNode;
  label: string;
}

export function AccountNavTab({ href, icon, label }: AccountNavTabProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-3 px-3.5 py-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] transition-colors rounded-none",
        isActive
          ? "bg-ink text-paper"
          : "text-taupe-700 hover:bg-ink/5 hover:text-ink",
      )}
    >
      <span className={cn(isActive ? "text-paper" : "text-taupe-400")} aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
