import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/favorites-view";

export const metadata: Metadata = {
  title: "Prendas Guardadas | INVESTMENTS",
  description: "Revisa tu selección de prendas favoritas y añádelas a tu bolsa de compra en INVESTMENTS.",
};

export const instant = false;

export default function PublicFavoritesPage() {
  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell">
        <FavoritesView isAccountPage={false} />
      </div>
    </div>
  );
}

