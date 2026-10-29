import type { Metadata } from "next";
import { NotFoundView } from "@/components/catalog/not-found-view";

export const metadata: Metadata = { title: "Producto no encontrado", robots: { index: false, follow: false } };

export default function ProductNotFound() {
  return (
    <NotFoundView
      title="Este producto no está disponible."
      message="Es posible que haya sido retirado del catálogo o que el enlace sea incorrecto."
      actionLabel="Ver más productos"
    />
  );
}