"use client";

import { RouteError } from "@/components/catalog/route-error";

export default function CatalogError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} />;
}