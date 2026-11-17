"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/server/actions/auth";
import { FaRightFromBracket, FaSpinner } from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function LogoutButton({ className, showIcon = true, label = "Cerrar sesión" }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/iniciar-sesion");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      aria-label="Cerrar sesión"
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 px-4 py-2 text-xs font-bold transition-all disabled:opacity-60 shadow-xs cursor-pointer",
        className,
      )}
    >
      {isPending ? (
        <FaSpinner className="size-3.5 animate-spin text-red-500" aria-hidden />
      ) : showIcon ? (
        <FaRightFromBracket className="size-3.5 text-red-500" aria-hidden />
      ) : null}
      <span>{isPending ? "Cerrando..." : label}</span>
    </button>
  );
}
