export default function ProductLoading() {
  return (
    <div className="bg-paper pt-[7.5rem] lg:pt-[8.75rem]" role="status" aria-label="Cargando producto">
      <div className="shell pb-24 pt-8">
        <div className="grid animate-pulse gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="aspect-[3/4] bg-taupe-100" />
          <div className="space-y-5 lg:pt-4">
            <div className="h-3 w-32 bg-taupe-100" />
            <div className="h-12 w-3/4 bg-taupe-100" />
            <div className="h-6 w-28 bg-taupe-100" />
            <div className="h-16 w-full bg-taupe-100" />
            <div className="h-14 w-full bg-taupe-100" />
          </div>
        </div>
        <span className="sr-only">Cargando producto…</span>
      </div>
    </div>
  );
}