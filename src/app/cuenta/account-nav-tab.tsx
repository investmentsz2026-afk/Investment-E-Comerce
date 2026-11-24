"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AccountNavTabProps {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: string;
}

export function AccountNavTab({ href, icon, label, badge }: AccountNavTabProps) {
  const pathname = usePathname();
  const isActive =
    href === "/cuenta"
      ? pathname === "/cuenta"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "group flex shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs transition-all duration-150 border-l-4",
        isActive
          ? "bg-blue-50/90 text-[#0055FF] font-bold border-l-[#0055FF] shadow-xs"
          : "border-l-transparent text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "transition-colors",
            isActive ? "text-[#0055FF]" : "text-slate-400 group-hover:text-slate-600",
          )}
          aria-hidden
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {badge && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wider",
            isActive
              ? "bg-[#0055FF] text-white"
              : "bg-red-50 text-[#EF233C] border border-red-200",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
