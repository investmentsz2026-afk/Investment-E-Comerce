"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { NoticeProvider } from "@/components/feedback/notice-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";

/**
 * Proveedores globales de cliente.
 * reducedMotion="user" desactiva automáticamente las animaciones de transformación
 * cuando el sistema operativo solicita movimiento reducido.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <NoticeProvider>
        <FavoritesProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </FavoritesProvider>
      </NoticeProvider>
    </MotionConfig>
  );
}
