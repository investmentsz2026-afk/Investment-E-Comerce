"use client";

import { RouteError } from "@/components/catalog/route-error";

export default function SearchError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="No pudimos completar la búsqueda" />;
}