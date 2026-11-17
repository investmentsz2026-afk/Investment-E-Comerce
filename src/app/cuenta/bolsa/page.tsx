import type { Metadata } from "next";
import { AccountCartView } from "@/components/cart/account-cart-view";

export const metadata: Metadata = {
  title: "Mi Bolsa Actual | American Colt JEANS™",
  description: "Gestiona las prendas seleccionadas en tu bolsa de compras oficial.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function AccountBolsaPage() {
  return <AccountCartView />;
}
