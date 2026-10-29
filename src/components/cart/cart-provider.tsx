"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  fetchCartSnapshotAction,
  addToCartAction,
  updateCartItemQuantityAction,
  removeCartItemAction,
  clearCartAction,
} from "@/server/actions/cart";
import type { CartSnapshot } from "@/server/cart/service";
import { useNotice } from "@/components/feedback/notice-provider";

const EMPTY_CART: CartSnapshot = {
  cartId: null,
  items: [],
  totalUnits: 0,
  lineCount: 0,
  retailSubtotalAmount: 0,
  wholesaleSavingsAmount: 0,
  estimatedTotalAmount: 0,
  currency: "PEN",
  isWholesaleAuthorized: false,
  userRole: null,
  hasStockIssues: false,
};

interface CartContextValue {
  cart: CartSnapshot;
  isOpen: boolean;
  isLoading: boolean;
  isMutating: boolean;
  pendingVariantId: number | null;
  errorMessage: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  clearError: () => void;
  refreshCart: () => Promise<void>;
  addItem: (params: {
    variantId: number;
    quantity?: number;
    openDrawerOnSuccess?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (params: {
    variantId: number;
    quantity: number;
  }) => Promise<{ success: boolean; error?: string }>;
  removeItem: (variantId: number) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => Promise<{ success: boolean; error?: string }>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartSnapshot>(EMPTY_CART);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVariantId, setPendingVariantId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMutating, startTransition] = useTransition();
  const { notify } = useNotice();
  const pathname = usePathname();

  const mutationSeqRef = useRef(0);

  const refreshCart = useCallback(async () => {
    const seqAtStart = mutationSeqRef.current;
    try {
      const res = await fetchCartSnapshotAction();
      // Solo aplicar si ninguna mutación ocurrió mientras se resolvía el fetch inicial
      if (res.success && res.data && mutationSeqRef.current === seqAtStart) {
        setCart(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sincronizar al montar y cuando cambie la ruta (ej: tras login / logout / cambio de rol)
  useEffect(() => {
    void refreshCart();
  }, [refreshCart, pathname]);

  const openDrawer = useCallback(() => {
    setErrorMessage(null);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const addItem = useCallback(
    async ({
      variantId,
      quantity = 1,
      openDrawerOnSuccess = true,
    }: {
      variantId: number;
      quantity?: number;
      openDrawerOnSuccess?: boolean;
    }) => {
      mutationSeqRef.current += 1;
      setErrorMessage(null);
      setPendingVariantId(variantId);

      try {
        const res = await addToCartAction({ variantId, quantity });
        if (!res.success || !res.data) {
          const msg = res.error ?? "No se pudo añadir la prenda a la bolsa.";
          setErrorMessage(msg);
          notify({
            title: "Atención en tu bolsa",
            description: msg,
          });
          return { success: false, error: msg };
        }

        const updatedSnapshot = res.data;
        startTransition(() => {
          setCart(updatedSnapshot);
          if (openDrawerOnSuccess) {
            setIsOpen(true);
          }
        });

        const addedLine = updatedSnapshot.items.find((i) => i.variantId === variantId);
        if (addedLine && !openDrawerOnSuccess) {
          notify({
            title: "Agregado a la bolsa",
            description: `${addedLine.productName} (${addedLine.colorName ?? ""} ${addedLine.size ?? ""}) · ${quantity} ${quantity === 1 ? "unidad" : "unidades"}.`,
          });
        }

        return { success: true };
      } finally {
        setPendingVariantId(null);
      }
    },
    [notify],
  );

  const updateQuantity = useCallback(
    async ({ variantId, quantity }: { variantId: number; quantity: number }) => {
      mutationSeqRef.current += 1;
      setErrorMessage(null);
      setPendingVariantId(variantId);

      try {
        const res = await updateCartItemQuantityAction({ variantId, quantity });
        if (!res.success || !res.data) {
          const msg = res.error ?? "No se pudo actualizar la cantidad.";
          setErrorMessage(msg);
          return { success: false, error: msg };
        }

        const updatedSnapshot = res.data;
        startTransition(() => {
          setCart(updatedSnapshot);
        });
        return { success: true };
      } finally {
        setPendingVariantId(null);
      }
    },
    [],
  );

  const removeItem = useCallback(async (variantId: number) => {
    mutationSeqRef.current += 1;
    setErrorMessage(null);
    setPendingVariantId(variantId);

    try {
      const res = await removeCartItemAction({ variantId });
      if (!res.success || !res.data) {
        const msg = res.error ?? "No se pudo eliminar el producto.";
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      const updatedSnapshot = res.data;
      startTransition(() => {
        setCart(updatedSnapshot);
      });
      return { success: true };
    } finally {
      setPendingVariantId(null);
    }
  }, []);

  const clearCart = useCallback(async () => {
    mutationSeqRef.current += 1;
    setErrorMessage(null);
    const res = await clearCartAction();
    if (!res.success || !res.data) {
      const msg = res.error ?? "No se pudo vaciar la bolsa.";
      setErrorMessage(msg);
      return { success: false, error: msg };
    }

    const updatedSnapshot = res.data;
    startTransition(() => {
      setCart(updatedSnapshot);
    });
    return { success: true };
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isOpen,
      isLoading,
      isMutating,
      pendingVariantId,
      errorMessage,
      openDrawer,
      closeDrawer,
      clearError,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      cart,
      isOpen,
      isLoading,
      isMutating,
      pendingVariantId,
      errorMessage,
      openDrawer,
      closeDrawer,
      clearError,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe utilizarse dentro de <CartProvider>.");
  }
  return ctx;
}

