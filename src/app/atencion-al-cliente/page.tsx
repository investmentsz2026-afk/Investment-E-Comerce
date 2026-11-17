import type { Metadata } from "next";
import { CustomerCareView } from "@/components/customer-care/customer-care-view";

export const metadata: Metadata = {
  title: "Atención al Cliente, Envíos y Guía de Tallas | American Colt JEANS™",
  description:
    "Centro oficial de atención al cliente de American Colt JEANS™: soporte por WhatsApp 24/7, guía de tallas anatómicas 28 a 46, envíos a todo el Perú y preguntas frecuentes.",
};

export default function CustomerCarePage() {
  return <CustomerCareView />;
}
