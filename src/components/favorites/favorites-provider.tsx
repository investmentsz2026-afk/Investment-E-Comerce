"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname } from "next/navigation";
import {
  fetchFavoritesSnapshotAction,
  removeFavoriteAction,
  syncGuestFavoritesAction,
  toggleFavoriteAction,
} from "@/server/actions/favorites";
import type { FavoriteProductItem, FavoritesSnapshot } from "@/server/favorites/service";
import { useNotice } from "@/components/feedback/notice-provider";

const GUEST_FAVORITES_STORAGE_KEY = "investments_guest_favorites_v1";

function readGuestSlugsFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s): s is string => typeof s === "string" && /^[a-z0-9-]+$/.test(s))
      .slice(0, 100);
  } catch {
    return [];
  }
}

function writeGuestSlugsToStorage(slugs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    if (slugs.length === 0) {
      window.localStorage.removeItem(GUEST_FAVORITES_STORAGE_KEY);
    } else {
      window.localStorage.setItem(GUEST_FAVORITES_STORAGE_KEY, JSON.stringify(slugs));
    }
  } catch {
    // ignore storage errors
  }
}

interface FavoritesContextValue {
  snapshot: FavoritesSnapshot;
  items: FavoriteProductItem[];
  slugs: string[];
  count: number;
  isHydrating: boolean;
  isMutating: boolean;
  isFavorite: (productSlug: string) => boolean;
  toggleFavorite: (
    productSlug: string,
    productName?: string,
  ) => Promise<{ ok: boolean; favorited?: boolean; error?: string }>;
  removeFavorite: (productSlug: string) => Promise<{ ok: boolean; error?: string }>;
  refreshFavorites: () => Promise<void>;
}

const EMPTY_SNAPSHOT: FavoritesSnapshot = {
  isAuthenticated: false,
  userId: null,
  userRole: null,
  isWholesaleAuthorized: false,
  slugs: [],
  items: [],
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notify } = useNotice();
  const [snapshot, setSnapshot] = useState<FavoritesSnapshot>(EMPTY_SNAPSHOT);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isPending, startTransition] = useTransition();

  const refreshFavorites = useCallback(async () => {
    const guestSlugs = readGuestSlugsFromStorage();
    const res = await fetchFavoritesSnapshotAction({ guestSlugs });
    if (!res.success || !res.data) {
      setIsHydrating(false);
      return;
    }

    if (res.data.isAuthenticated) {
      if (guestSlugs.length > 0) {
        writeGuestSlugsToStorage([]);
      }
    } else {
      writeGuestSlugsToStorage(res.data.slugs);
    }

    setSnapshot(res.data);
    setIsHydrating(false);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await refreshFavorites();
      if (!active) return;
    };
    void load();
    return () => {
      active = false;
    };
  }, [pathname, refreshFavorites]);

  const isFavorite = useCallback(
    (productSlug: string) => {
      const clean = productSlug.trim().toLowerCase();
      return snapshot.slugs.includes(clean);
    },
    [snapshot.slugs],
  );

  const toggleFavorite = useCallback(
    async (productSlug: string, productName?: string) => {
      const clean = productSlug.trim().toLowerCase();
      const guestSlugs = readGuestSlugsFromStorage();

      // Actualización optimista inmediata del estado de slugs
      const wasFav = snapshot.slugs.includes(clean);
      setSnapshot((prev) => ({
        ...prev,
        slugs: wasFav
          ? prev.slugs.filter((s) => s !== clean)
          : [clean, ...prev.slugs.filter((s) => s !== clean)],
      }));

      const res = await toggleFavoriteAction({
        productSlug: clean,
        guestSlugs,
      });

      if (res.success && res.data) {
        const { favorited, productName: resolvedName, snapshot: nextSnap } = res.data;
        if (!nextSnap.isAuthenticated) {
          writeGuestSlugsToStorage(nextSnap.slugs);
        }
        startTransition(() => {
          setSnapshot(nextSnap);
        });

        const label = productName || resolvedName || "Prenda";
        notify({
          title: favorited ? "Guardado en tus favoritos" : "Eliminado de favoritos",
          description: favorited
            ? `${label} se añadió a tu selección de favoritos.`
            : `${label} se quitó de tu selección de favoritos.`,
        });

        return { ok: true, favorited };
      }

      // Revertir estado optimista si falló
      await refreshFavorites();
      return { ok: false, error: res.error };
    },
    [snapshot.slugs, notify, refreshFavorites],
  );

  const removeFavorite = useCallback(
    async (productSlug: string) => {
      const clean = productSlug.trim().toLowerCase();
      const guestSlugs = readGuestSlugsFromStorage();

      setSnapshot((prev) => ({
        ...prev,
        slugs: prev.slugs.filter((s) => s !== clean),
        items: prev.items.filter((i) => i.slug !== clean),
      }));

      const res = await removeFavoriteAction({
        productSlug: clean,
        guestSlugs,
      });

      if (res.success && res.data) {
        if (!res.data.isAuthenticated) {
          writeGuestSlugsToStorage(res.data.slugs);
        }
        startTransition(() => {
          setSnapshot(res.data!);
        });
        notify({
          title: "Eliminado de favoritos",
          description: "La prenda fue retirada de tu lista de favoritos.",
        });
        return { ok: true };
      }

      await refreshFavorites();
      return { ok: false, error: res.error };
    },
    [notify, refreshFavorites],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      snapshot,
      items: snapshot.items,
      slugs: snapshot.slugs,
      count: snapshot.slugs.length,
      isHydrating,
      isMutating: isPending,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      refreshFavorites,
    }),
    [
      snapshot,
      isHydrating,
      isPending,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      refreshFavorites,
    ],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites debe usarse dentro de <FavoritesProvider>.");
  }
  return ctx;
}
