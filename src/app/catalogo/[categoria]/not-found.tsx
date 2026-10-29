import type { Metadata } from "next";
import { NotFoundView } from "@/components/catalog/not-found-view";

export const metadata: Metadata = { title: "Categoría no encontrada", robots: { index: false, follow: false } };

export default function CategoryNotFound() {
  return (
    <NotFoundView
      title="No encontramos esta categoría."
      message="Puede que ya no exista o que el enlace sea incorrecto. Explora el catálogo completo."
    />
  );
}