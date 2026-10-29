import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";

export default function SearchLoading() {
  return (
    <div className="bg-paper pt-[7.5rem] lg:pt-[8.75rem]">
      <div className="shell">
        <div className="pb-10 pt-12 lg:pb-16">
          <div className="h-12 w-1/2 max-w-sm animate-pulse bg-taupe-100" />
        </div>
        <CatalogSkeleton count={4} />
      </div>
    </div>
  );
}