"use client";

import { RouteError } from "@/components/catalog/route-error";

export default function ProductError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="No pudimos cargar este producto" />;
}