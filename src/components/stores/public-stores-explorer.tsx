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
    <div className="space-y-5 font-sans">
      {/* CABECERA + CONTROLES */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[#DC2626]">
            <Sparkles className="size-3.5" />
            <span>Recojo Gratis en Tienda Oficial</span>
          </div>
          {compactHeading ? (
            <h2 className="font-sans text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Nuestras Tiendas de Recojo
            </h2>
          ) : (
            <h1 className="font-sans text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Nuestras Tiendas de Recojo
            </h1>
          )}
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
            Busca tu tienda más cercana, consulta horarios y haz clic en
            cualquier local para ver exactamente dónde queda en el mapa.
          </p>
        </div>

        {/* Toggle Vista Tarjetas / Lista */}
        <div className="inline-flex self-start items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              viewMode === "cards"
                ? "bg-white text-[#DC2626] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="size-3.5" />
            <span>Tarjetas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              viewMode === "list"
                ? "bg-white text-[#DC2626] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="size-3.5" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA DE TIENDAS */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white p-3.5 shadow-[0_12px_30px_-14px_rgba(15,23,42,0.14)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busca tu tienda más cercana por distrito, nombre o avenida..."
            className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
          />
        </div>

        <span className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-3.5 py-2 text-xs font-extrabold text-[#991B1B]">
          <Store className="size-4" />
          <span>{filteredStores.length} tiendas habilitadas</span>
        </span>
      </div>

      {stores.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <Store className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-base font-extrabold text-slate-900">
            Próximamente nuevas tiendas de recojo disponibles
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* COLUMNA IZQUIERDA: TARJETAS COMPACTAS O LISTA */}
          <div className="lg:col-span-5">
            {filteredStores.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-bold text-slate-500">
                No se encontraron tiendas con esa búsqueda.
              </div>
            ) : viewMode === "cards" ? (
              <div className="max-h-[540px] space-y-2.5 overflow-y-auto pr-1">
                {filteredStores.map((st) => {
                  const isSelected = selectedStoreId === st.id;
                  return (
                    <motion.div
                      key={st.id}
                      whileHover={{ y: -1 }}
                      onClick={() => setSelectedStoreId(st.id)}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                        isSelected
                          ? "border-[#DC2626] bg-red-50/55 shadow-[0_8px_20px_-10px_rgba(220,38,38,0.35)] ring-2 ring-[#DC2626]/20"
                          : "border-slate-200/90 bg-white shadow-xs hover:border-red-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-block rounded-md bg-slate-900 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider text-white">
                              {st.district} · {st.department}
                            </span>
                            {isSelected && (
                              <span className="inline-block rounded-md bg-[#DC2626] px-2 py-0.5 text-[0.58rem] font-extrabold uppercase text-white">
                                En mapa
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1.5 truncate font-sans text-sm font-black text-slate-900">
                            {st.name}
                          </h3>
                        </div>
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-[#DC2626] text-white"
                              : "bg-red-50 text-[#DC2626]"
                          }`}
                        >
                          <MapPin className="size-3.5" />
                        </span>
                      </div>

                      <p className="mt-1.5 truncate text-xs font-bold text-slate-700">
                        {st.address}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[0.68rem]">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                          <Clock className="size-3 text-slate-400" />
                          {st.openingHours}
                          {st.phone ? (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 font-bold text-slate-700">
                              · <Phone className="size-2.5" /> {st.phone}
                            </span>
                          ) : null}
                        </span>

                        <a
                          href={getStoreGoogleMapsHref(st)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-2.5 py-1 text-[0.65rem] font-extrabold text-white shadow-xs hover:brightness-110"
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
              <div className="max-h-[540px] divide-y divide-slate-100 overflow-y-auto rounded-3xl border border-slate-200/90 bg-white shadow-sm">
                {filteredStores.map((st) => {
                  const isSelected = selectedStoreId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStoreId(st.id)}
                      className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition ${
                        isSelected
                          ? "bg-red-50/75"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase text-white">
                            {st.district}
                          </span>
                          <p className="truncate text-xs font-black text-slate-900">
                            {st.name}
                          </p>
                        </div>
                        <p className="truncate text-xs font-semibold text-slate-600">
                          {st.address}
                        </p>
                        <p className="text-[0.65rem] font-medium text-slate-500">
                          {st.openingHours}
                          {st.phone ? ` · Tel: ${st.phone}` : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-[0.65rem] font-extrabold ${
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
          <div className="space-y-3 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-xs">
              {selectedStore ? (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#DC2626]">
                      <MapPin className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                        Estamos viendo en el mapa
                      </p>
                      <p className="truncate text-sm font-black text-slate-900">
                        {selectedStore.name} ·{" "}
                        <span className="font-bold text-slate-600">
                          {selectedStore.address}, {selectedStore.district}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStoreId(null)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                    >
                      <RotateCcw className="size-3" />
                      <span>Ver todas</span>
                    </button>
                    <a
                      href={getStoreGoogleMapsHref(selectedStore)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:brightness-110"
                    >
                      <Navigation className="size-3" />
                      <span>Cómo llegar</span>
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Compass className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Selecciona una tienda de la izquierda para ver su
                      ubicación exacta
                    </p>
                    <p className="text-[0.7rem] font-medium text-slate-500">
                      También puedes hacer clic en cualquier pin rojo del mapa
                      para ver dirección y horarios.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <InteractiveStoresMapViewer
              stores={stores}
              selectedStoreId={selectedStoreId}
              onSelectStore={(st) => setSelectedStoreId(st.id)}
              heightClassName="h-[440px] sm:h-[470px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
