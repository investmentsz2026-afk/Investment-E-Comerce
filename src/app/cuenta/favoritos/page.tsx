import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/favorites-view";

export const metadata: Metadata = {
  title: "Mis Favoritos | American Colt JEANS™",
  description: "Consulta y administra tu selección de prendas y colecciones guardadas en American Colt JEANS™.",
  robots: { index: false, follow: false },
};

export default function AccountFavoritesPage() {
  return <FavoritesView isAccountPage={true} />;
}
