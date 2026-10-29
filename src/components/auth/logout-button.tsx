"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/server/actions/auth";
import { LogOut, Loader2 } from "lucide-react";
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
        "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-taupe-600 transition-colors hover:text-cochinilla disabled:opacity-60",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : showIcon ? (
        <LogOut className="size-3.5" aria-hidden />
      ) : null}
      <span>{isPending ? "Cerrando..." : label}</span>
    </button>
  );
}
