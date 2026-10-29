import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/favorites-view";

export const metadata: Metadata = {
  title: "Mis Favoritos | INVESTMENTS",
  description: "Consulta y administra tu lista de prendas y colecciones guardadas en INVESTMENTS.",
  robots: { index: false, follow: false },
};

export default function AccountFavoritesPage() {
  return <FavoritesView isAccountPage={true} />;
}

