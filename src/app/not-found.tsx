import type { Metadata } from "next";
import { NotFoundView } from "@/components/catalog/not-found-view";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <NotFoundView
      title="Esta página no existe."
      message="Es posible que el enlace haya cambiado o que la página ya no esté disponible."
      actionHref="/catalogo"
      actionLabel="Ver catálogo"
    />
  );
}