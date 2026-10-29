import Link from "next/link";

interface NotFoundViewProps {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}

/** Pantalla 404 editorial con salida clara hacia el catálogo. */
export function NotFoundView({
  title,
  message,
  actionHref = "/catalogo",
  actionLabel = "Ver catálogo",
}: NotFoundViewProps) {
  return (
    <div className="bg-paper pt-[7.5rem] lg:pt-[8.75rem]">
      <div className="shell flex min-h-[50vh] flex-col items-center justify-center pb-24 text-center">
        <p className="eyebrow text-taupe-500">Error 404</p>
        <h1 className="mt-4 font-display text-display-md text-ink">{title}</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-taupe-600">{message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={actionHref}
            className="inline-flex h-12 items-center bg-ink px-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
          >
            {actionLabel}
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center border border-ink/20 px-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
