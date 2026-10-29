import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";

export default function CatalogLoading() {
  return (
    <div className="bg-paper pt-[7.5rem] lg:pt-[8.75rem]">
      <div className="shell">
        <div className="pb-10 pt-12 lg:pb-16">
          <div className="h-14 w-2/3 max-w-md animate-pulse bg-taupe-100" />
          <div className="mt-6 h-4 w-1/2 max-w-sm animate-pulse bg-taupe-100" />
        </div>
        <CatalogSkeleton />
      </div>
    </div>
  );
}