"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { PhysicalStoreRecord } from "@/server/shipping/service";
import {
  getStoreGoogleMapsHref,
  InteractiveStoresMapViewer,
} from "@/components/stores/interactive-peru-map";
import {
  Clock,
  Compass,
  LayoutGrid,
  List,
  MapPin,
  Navigation,
  Phone,
  RotateCcw,
  Search,
  Sparkles,
  Store,
} from "lucide-react";

type ViewMode = "cards" | "list";

export function PublicStoresExplorer({
  stores,
  compactHeading = false,
}: {
  stores: PhysicalStoreRecord[];
  compactHeading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const filteredStores = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) =>
      [s.name, s.district, s.province, s.department, s.address, s.reference ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [stores, search]);

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) ?? null,
    [stores, selectedStoreId],
  );

  return (
    <div className="space-y-3 font-sans sm:space-y-5">
      {/* CABECERA + CONTROLES */}
      <div className="flex flex-col justify-between gap-2.5 lg:flex-row lg:items-end lg:gap-4">
        <div className="space-y-1 sm:space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[#DC2626] sm:gap-2 sm:px-3.5 sm:py-1 sm:text-[0.68rem]">
            <Sparkles className="size-3 sm:size-3.5" />
            <span>Recojo Gratis en Tienda Oficial</span>
          </div>
          {compactHeading ? (
            <h2 className="font-sans text-xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Nuestras Tiendas de Recojo
            </h2>
          ) : (
            <h1 className="font-sans text-xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Nuestras Tiendas de Recojo
            </h1>
          )}
          <p className="max-w-2xl text-[0.72rem] font-medium leading-snug text-slate-600 sm:text-sm sm:leading-relaxed">
            Busca tu tienda más cercana, consulta horarios y toca cualquier local para ubicarlo al instante en el mapa.
          </p>
        </div>

        {/* Toggle Vista Tarjetas / Lista */}
        <div className="inline-flex self-start items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 sm:rounded-2xl sm:p-1 lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.66rem] font-extrabold transition sm:gap-1.5 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs ${
              viewMode === "cards"
                ? "bg-white text-[#DC2626] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="size-3 sm:size-3.5" />
            <span>Tarjetas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.66rem] font-extrabold transition sm:gap-1.5 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs ${
              viewMode === "list"
                ? "bg-white text-[#DC2626] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="size-3 sm:size-3.5" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA DE TIENDAS */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-[0_12px_30px_-14px_rgba(15,23,42,0.14)] sm:flex-row sm:items-center sm:gap-3 sm:rounded-3xl sm:p-3.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 sm:left-3.5 sm:size-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por distrito, nombre o avenida..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15 sm:h-10 sm:rounded-2xl sm:pl-10 sm:pr-4 sm:text-sm"
          />
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-1.5 text-[0.66rem] font-extrabold text-[#991B1B] sm:rounded-2xl sm:px-3.5 sm:py-2 sm:text-xs">
          <Store className="size-3.5 sm:size-4" />
          <span>{filteredStores.length} tiendas habilitadas</span>
        </span>
      </div>

      {stores.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center sm:p-14">
          <Store className="mx-auto size-9 text-slate-300 sm:size-10" />
          <p className="mt-3 text-sm font-extrabold text-slate-900 sm:text-base">
            Próximamente nuevas tiendas de recojo disponibles
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12 lg:gap-5">
          {/* COLUMNA IZQUIERDA: TARJETAS COMPACTAS (2 COLUMNAS EN MÓVIL) O LISTA */}
          <div className="lg:col-span-5">
            {filteredStores.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-10 sm:text-sm">
                No se encontraron tiendas con esa búsqueda.
              </div>
            ) : viewMode === "cards" ? (
              <div className="grid max-h-[265px] grid-cols-2 gap-2 overflow-y-auto pr-0.5 sm:max-h-[420px] sm:gap-2.5 lg:max-h-[540px] lg:grid-cols-1 lg:pr-1">
                {filteredStores.map((st) => {
                  const isSelected = selectedStoreId === st.id;
                  return (
                    <motion.div
                      key={st.id}
                      whileHover={{ y: -1 }}
                      onClick={() => setSelectedStoreId(st.id)}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-2.5 transition-all sm:rounded-2xl sm:p-3.5 ${
                        isSelected
                          ? "border-[#DC2626] bg-red-50/55 shadow-[0_8px_20px_-10px_rgba(220,38,38,0.35)] ring-2 ring-[#DC2626]/20"
                          : "border-slate-200/90 bg-white shadow-xs hover:border-red-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="inline-block truncate rounded bg-slate-900 px-1.5 py-0.5 text-[0.52rem] font-extrabold uppercase tracking-wider text-white sm:rounded-md sm:px-2 sm:text-[0.6rem]">
                                {st.district}
                              </span>
                              {isSelected && (
                                <span className="inline-block rounded bg-[#DC2626] px-1.5 py-0.5 text-[0.5rem] font-extrabold uppercase text-white sm:rounded-md sm:px-2 sm:text-[0.58rem]">
                                  En mapa
                                </span>
                              )}
                            </div>
                            <h3 className="mt-1 line-clamp-1 font-sans text-[0.72rem] font-black text-slate-900 sm:mt-1.5 sm:text-sm">
                              {st.name}
                            </h3>
                          </div>
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-lg sm:size-7 sm:rounded-xl ${
                              isSelected
                                ? "bg-[#DC2626] text-white"
                                : "bg-red-50 text-[#DC2626]"
                            }`}
                          >
                            <MapPin className="size-3 sm:size-3.5" />
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-[0.64rem] font-bold leading-tight text-slate-700 sm:mt-1.5 sm:line-clamp-1 sm:text-xs">
                          {st.address}
                        </p>
                      </div>

                      <div className="mt-2 flex flex-col gap-1.5 border-t border-slate-100 pt-1.5 text-[0.58rem] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pt-2 sm:text-[0.68rem]">
                        <span className="inline-flex items-center gap-1 truncate font-semibold text-slate-500">
                          <Clock className="size-2.5 shrink-0 text-slate-400 sm:size-3" />
                          <span className="truncate">{st.openingHours}</span>
                          {st.phone ? (
                            <span className="hidden items-center gap-0.5 font-bold text-slate-700 sm:inline-flex">
                              · <Phone className="size-2.5" /> {st.phone}
                            </span>
                          ) : null}
                        </span>

                        <a
                          href={getStoreGoogleMapsHref(st)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex w-fit items-center gap-1 rounded-md bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-2 py-1 text-[0.58rem] font-extrabold text-white shadow-xs hover:brightness-110 sm:rounded-lg sm:px-2.5 sm:text-[0.65rem]"
                        >
                          <Navigation className="size-2.5" />
                          <span>Cómo llegar</span>
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="max-h-[265px] divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:max-h-[540px] sm:rounded-3xl">
                {filteredStores.map((st) => {
                  const isSelected = selectedStoreId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStoreId(st.id)}
                      className={`flex w-full items-start justify-between gap-2.5 px-3 py-2 text-left transition sm:gap-3 sm:px-4 sm:py-3 ${
                        isSelected
                          ? "bg-red-50/75"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[0.54rem] font-extrabold uppercase text-white sm:rounded-md sm:px-2 sm:text-[0.6rem]">
                            {st.district}
                          </span>
                          <p className="truncate text-[0.72rem] font-black text-slate-900 sm:text-xs">
                            {st.name}
                          </p>
                        </div>
                        <p className="truncate text-[0.66rem] font-semibold text-slate-600 sm:text-xs">
                          {st.address}
                        </p>
                        <p className="truncate text-[0.6rem] font-medium text-slate-500 sm:text-[0.65rem]">
                          {st.openingHours}
                          {st.phone ? ` · Tel: ${st.phone}` : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-1 text-[0.58rem] font-extrabold sm:rounded-lg sm:px-2.5 sm:text-[0.65rem] ${
                          isSelected
                            ? "bg-[#DC2626] text-white"
                            : "bg-red-50 text-[#DC2626]"
                        }`}
                      >
                        {isSelected ? "Viendo" : "Ubicar"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: TÍTULO DINÁMICO DE TIENDA SELECCIONADA + MAPA */}
          <div className="space-y-2.5 sm:space-y-3 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-xs sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
              {selectedStore ? (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#DC2626] sm:size-9 sm:rounded-xl">
                      <MapPin className="size-3.5 sm:size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.56rem] font-extrabold uppercase tracking-wider text-[#DC2626] sm:text-[0.65rem]">
                        Viendo en mapa
                      </p>
                      <p className="truncate text-xs font-black text-slate-900 sm:text-sm">
                        {selectedStore.name} ·{" "}
                        <span className="font-bold text-slate-600">
                          {selectedStore.address}, {selectedStore.district}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStoreId(null)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[0.62rem] font-extrabold text-slate-700 hover:bg-slate-100 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs"
                    >
                      <RotateCcw className="size-2.5 sm:size-3" />
                      <span>Todas</span>
                    </button>
                    <a
                      href={getStoreGoogleMapsHref(selectedStore)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-2.5 py-1 text-[0.62rem] font-extrabold text-white shadow-xs hover:brightness-110 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs"
                    >
                      <Navigation className="size-2.5 sm:size-3" />
                      <span>Cómo llegar</span>
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 sm:size-9 sm:rounded-xl">
                    <Compass className="size-3.5 sm:size-4" />
                  </span>
                  <div>
                    <p className="text-[0.68rem] font-black text-slate-900 sm:text-xs">
                      Toca una tienda para centrar su ubicación en el mapa
                    </p>
                    <p className="text-[0.62rem] font-medium text-slate-500 sm:text-[0.7rem]">
                      También puedes tocar cualquier pin rojo para ver dirección y horario.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <InteractiveStoresMapViewer
              stores={stores}
              selectedStoreId={selectedStoreId}
              onSelectStore={(st) => setSelectedStoreId(st.id)}
              heightClassName="h-[290px] sm:h-[410px] lg:h-[470px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
