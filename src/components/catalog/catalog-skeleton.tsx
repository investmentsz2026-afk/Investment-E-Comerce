/** Esqueleto de carga del catálogo (cuadrícula de tarjetas). */
export function CatalogSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando productos"
      className="grid grid-cols-2 gap-x-3 gap-y-10 pb-20 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-taupe-100" />
          <div className="mt-4 h-3 w-2/3 bg-taupe-100" />
          <div className="mt-2 h-3 w-1/3 bg-taupe-100" />
        </div>
      ))}
      <span className="sr-only">Cargando productos…</span>
    </div>
  );
}
