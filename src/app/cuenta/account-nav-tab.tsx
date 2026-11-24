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
        "group flex min-w-0 items-center justify-between gap-1.5 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2 text-[0.68rem] transition-all duration-150 lg:border-0 lg:border-l-4 lg:bg-transparent lg:px-4 lg:py-3 lg:text-xs",
        isActive
          ? "border-blue-200 bg-blue-50/90 font-bold text-[#0055FF] shadow-xs lg:border-l-[#0055FF]"
          : "border-l-transparent font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <div className="flex min-w-0 items-center gap-2 lg:gap-3">
        <span
          className={cn(
            "shrink-0 transition-colors",
            isActive ? "text-[#0055FF]" : "text-slate-400 group-hover:text-slate-600",
          )}
          aria-hidden
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span
          className={cn(
            "hidden shrink-0 rounded-full px-1.5 py-0.5 text-[0.55rem] font-black uppercase tracking-wider sm:inline-block lg:px-2 lg:text-[0.62rem]",
            isActive
              ? "bg-[#0055FF] text-white"
              : "border border-red-200 bg-red-50 text-[#EF233C]",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
