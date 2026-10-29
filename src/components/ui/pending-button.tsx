"use client";

import type { ReactNode } from "react";
import type { FeatureKey } from "@/config/roadmap";
import { useNotice } from "@/components/feedback/notice-provider";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

interface PendingButtonProps {
  feature: FeatureKey;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Botón de llamada a la acción para una funcionalidad de una fase futura. */
export function PendingButton({ feature, ...props }: PendingButtonProps) {
  const { announcePending } = useNotice();
  return <Button {...props} data-pending-feature={feature} onClick={() => announcePending(feature)} />;
}
