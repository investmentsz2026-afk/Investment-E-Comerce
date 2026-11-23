"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Store,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  LayoutGrid,
  List,
  Map as MapIcon,
  Search,
  Sparkles,
  ShieldAlert,
  X,
  Save,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { PhysicalStoreRecord } from "@/server/shipping/service";
import {
  savePhysicalStoreAction,
  deletePhysicalStoreAction,
  type SavePhysicalStoreInput,
} from "@/server/actions/shipping";
import {
  getPeruDepartments,
  getPeruProvinces,
  getPeruDistricts,
} from "@/data/peru-locations";
import {
  extractCoordsFromMapsUrl,
  InteractiveMapPicker,
  InteractiveStoresMapViewer,
  type GeocodeResult,
} from "@/components/stores/interactive-peru-map";

interface AdminStoresManagerProps {
  initialStores: PhysicalStoreRecord[];
}

type StoreSubmodule = "list" | "map";
type ViewMode = "cards" | "table";

function foldGeo(val: string): string {
  return val
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function AdminStoresManager({ initialStores }: AdminStoresManagerProps) {
  const router = useRouter();
  const stores = initialStores;
  const [isPending, startTransition] = useTransition();

  const [activeSubmodule, setActiveSubmodule] =
    useState<StoreSubmodule>("list");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapPage, setMapPage] = useState(1);
  const [selectedMapStoreId, setSelectedMapStoreId] = useState<number | null>(
    stores[0]?.id ?? null,
  );

  // Modales modernos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PhysicalStoreRecord | null>(
    null,
  );

  // Campos del formulario modal
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("Lima");
  const [formProv, setFormProv] = useState("Lima");
  const [formDist, setFormDist] = useState("La Victoria");
  const [formAddress, setFormAddress] = useState("");
  const [formReference, setFormReference] = useState("");
  const [formPhone, setFormPhone] = useState("926 922 583");
  const [formHours, setFormHours] = useState(
    "Lunes a Sábado: 10:00 am - 8:00 pm",
  );
  const [formMapsUrl, setFormMapsUrl] = useState("");
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);
  const [formIsActive, setFormIsActive] = useState(true);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const departments = getPeruDepartments();
  const provinces = getPeruProvinces(formDept);
  const districts = getPeruDistricts(formDept, formProv);

  const kpis = useMemo(() => {
    const activeCount = stores.filter((s) => s.isActive).length;
    return {
      total: stores.length,
      activeCount,
      pausedCount: stores.length - activeCount,
    };
  }, [stores]);

  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) =>
      [
        s.name,
        s.code,
        s.department,
        s.province,
        s.district,
        s.address,
        s.reference ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [stores, searchQuery]);

  const mapMatchingStores = useMemo(() => {
    const q = mapSearchQuery.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) =>
      [s.name, s.district, s.province, s.department, s.address]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [stores, mapSearchQuery]);

  const handleOpenCreate = () => {
    setEditingStoreId(null);
    setFormName("Tienda American Colt — ");
    setFormDept("Lima");
    setFormProv("Lima");
    setFormDist("La Victoria");
    setFormAddress("");
    setFormReference("");
    setFormPhone("926 922 583");
    setFormHours("Lunes a Sábado: 10:00 am - 8:00 pm");
    setFormMapsUrl("");
    setFormLat(null);
    setFormLng(null);
    setFormIsActive(true);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (store: PhysicalStoreRecord) => {
    const urlCoords = extractCoordsFromMapsUrl(store.googleMapsUrl);
    setEditingStoreId(store.id);
    setFormName(store.name);
    setFormDept(store.department);
    setFormProv(store.province);
    setFormDist(store.district);
    setFormAddress(store.address);
    setFormReference(store.reference ?? "");
    setFormPhone(store.phone ?? "926 922 583");
    setFormHours(store.openingHours);
    setFormMapsUrl(store.googleMapsUrl ?? "");
    setFormLat(store.latitude ?? urlCoords?.[0] ?? null);
    setFormLng(store.longitude ?? urlCoords?.[1] ?? null);
    setFormIsActive(store.isActive);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleDeptChange = (newDept: string) => {
    setFormDept(newDept);
    const provs = getPeruProvinces(newDept);
    const firstProv = provs[0] ?? "";
    setFormProv(firstProv);
    const dists = getPeruDistricts(newDept, firstProv);
    setFormDist(dists[0] ?? "");
  };

  const handleProvChange = (newProv: string) => {
    setFormProv(newProv);
    const dists = getPeruDistricts(formDept, newProv);
    setFormDist(dists[0] ?? "");
  };

  const handleMapPickLocation = (loc: GeocodeResult) => {
    setFormLat(loc.lat);
    setFormLng(loc.lng);
    setFormMapsUrl(
      `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`,
    );

    if (loc.shortAddress && (!formAddress.trim() || isModalOpen)) {
      setFormAddress(loc.shortAddress);
    }

    // Intentar empatar departamento/provincia/distrito con nuestro catálogo geográfico
    if (loc.department) {
      const matchedDept = departments.find(
        (d) =>
          foldGeo(loc.department).includes(foldGeo(d)) ||
          foldGeo(d).includes(foldGeo(loc.department)),
      );
      if (matchedDept) {
        setFormDept(matchedDept);
        const provs = getPeruProvinces(matchedDept);
        const matchedProv =
          provs.find(
            (p) =>
              loc.province &&
              (foldGeo(loc.province).includes(foldGeo(p)) ||
                foldGeo(p).includes(foldGeo(loc.province))),
          ) ?? provs[0];
        if (matchedProv) {
          setFormProv(matchedProv);
          const dists = getPeruDistricts(matchedDept, matchedProv);
          const matchedDist = dists.find(
            (d) =>
              loc.district &&
              (foldGeo(loc.district).includes(foldGeo(d)) ||
                foldGeo(d).includes(foldGeo(loc.district))),
          );
          if (matchedDist) {
            setFormDist(matchedDist);
          }
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload: SavePhysicalStoreInput = {
      storeId: editingStoreId,
      name: formName,
      department: formDept,
      province: formProv,
      district: formDist,
      address: formAddress,
      reference: formReference,
      phone: formPhone,
      openingHours: formHours,
      googleMapsUrl:
        formMapsUrl ||
        (typeof formLat === "number" && typeof formLng === "number"
          ? `https://www.google.com/maps/search/?api=1&query=${formLat},${formLng}`
          : ""),
      latitude: formLat,
      longitude: formLng,
      isActive: formIsActive,
    };

    startTransition(async () => {
      const res = await savePhysicalStoreAction(payload);
      if (res.success && res.data) {
        setFeedback({
          type: "success",
          message: editingStoreId
            ? "Tienda física actualizada correctamente y reflejada en el mapa."
            : "Nueva tienda física creada y publicada para recojo.",
        });
        setSelectedMapStoreId(res.data.storeId);
        setIsModalOpen(false);
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error ?? "No se pudo guardar la tienda física.",
        });
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    startTransition(async () => {
      const res = await deletePhysicalStoreAction(target.id);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `Tienda "${target.name}" eliminada correctamente.`,
        });
        if (selectedMapStoreId === target.id) {
          setSelectedMapStoreId(null);
        }
        setDeleteTarget(null);
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error ?? "No se pudo eliminar la tienda.",
        });
      }
    });
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* HERO 3D MODERNO */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl border border-red-900/20 bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] p-6 text-white shadow-[0_22px_50px_-14px_rgba(220,38,38,0.42)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-60 rounded-full bg-black/15 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md">
              <Sparkles className="size-3.5" />
              <span>Puntos de Recojo Oficiales + Mapa Interactivo 3D</span>
            </div>
            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              Tiendas Físicas y Puntos de Recojo
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base">
              Administra tus locales oficiales, ubica su punto exacto en el mapa
              interactivo, y sincroniza en tiempo real el mapa público de
              Nuestras Tiendas de Recojo y el checkout.
            </p>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenCreate}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/40 bg-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#991B1B] shadow-[0_6px_0_rgba(127,29,29,0.28),0_14px_26px_rgba(0,0,0,0.2)] transition-all hover:bg-red-50"
          >
            <Plus className="size-4" />
            <span>Agregar Tienda de Recojo</span>
          </motion.button>
        </div>
      </motion.section>

      {/* KPIS 3D */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
              Total Tiendas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
              <Store className="size-5" />
            </span>
          </div>
          <p className="mt-2 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.total}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Sucursales registradas
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-emerald-700">
              Activas en Tienda y Mapa
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </span>
          </div>
          <p className="mt-2 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.activeCount}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Disponibles para recojo gratis
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
              En Pausa / Cerradas
            </span>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <XCircle className="size-5" />
            </span>
          </div>
          <p className="mt-2 font-sans text-3xl font-black tabular-nums text-slate-900">
            {kpis.pausedCount}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Ocultas en el selector público
          </p>
        </div>
      </section>

      {/* BARRA DE SUBMÓDULOS */}
      <nav
        aria-label="Submódulos de tiendas"
        className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white p-2.5 shadow-[0_12px_28px_-14px_rgba(15,23,42,0.15)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubmodule("list")}
            className={`relative flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-colors ${
              activeSubmodule === "list"
                ? "text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {activeSubmodule === "list" && (
              <motion.span
                layoutId="storesSubmodulePill"
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] shadow-md"
              />
            )}
            <Store className="relative z-10 size-4" />
            <span className="relative z-10">
              Listado de Tiendas ({stores.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubmodule("map")}
            className={`relative flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-colors ${
              activeSubmodule === "map"
                ? "text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {activeSubmodule === "map" && (
              <motion.span
                layoutId="storesSubmodulePill"
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] shadow-md"
              />
            )}
            <MapIcon className="relative z-10 size-4" />
            <span className="relative z-10">Ver Tiendas en el Mapa</span>
          </button>
        </div>

        {activeSubmodule === "list" && (
          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                viewMode === "cards"
                  ? "bg-white text-[#DC2626] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Tarjetas 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                viewMode === "table"
                  ? "bg-white text-[#DC2626] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="size-3.5" />
              <span>Tabla / Lista</span>
            </button>
          </div>
        )}
      </nav>

      {/* FEEDBACK */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 text-sm font-bold shadow-sm ${
              feedback.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                : "border-red-300 bg-red-50 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="size-5 shrink-0 text-[#DC2626]" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-lg p-1 hover:bg-black/5"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUBMÓDULO 1: LISTADO DE TIENDAS (TARJETAS 3D O TABLA) */}
      {activeSubmodule === "list" && (
        <>
          <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tienda por nombre, distrito, departamento o dirección..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
              />
            </div>
          </div>

          {filteredStores.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
              <Store className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 text-base font-extrabold text-slate-900">
                No hay tiendas registradas con esa búsqueda
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Haz clic en &ldquo;Agregar Tienda de Recojo&rdquo; para
                registrar tu primera sucursal en el mapa.
              </p>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {filteredStores.map((st, idx) => (
                <motion.article
                  key={st.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ y: -3 }}
                  className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.16)] transition-all hover:border-red-300/70"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1.5 ${
                      st.isActive
                        ? "bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]"
                        : "bg-slate-300"
                    }`}
                  />

                  <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-xl bg-slate-900 px-2.5 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-white">
                          {st.district}
                        </span>
                        <span className="rounded-xl bg-slate-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-slate-600">
                          {st.province}, {st.department}
                        </span>
                      </div>
                      <h3 className="mt-2 font-sans text-lg font-black text-slate-900">
                        {st.name}
                      </h3>
                    </div>

                    {st.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">
                        <XCircle className="size-3.5" />
                        Inactiva
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs font-medium text-slate-700">
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
                      <span>
                        <strong className="font-extrabold text-slate-900">
                          {st.address}
                        </strong>
                        {st.reference ? ` — Ref: ${st.reference}` : ""}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="size-4 shrink-0 text-slate-400" />
                      <span className="font-semibold">{st.openingHours}</span>
                    </p>
                    {st.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="size-4 shrink-0 text-slate-400" />
                        <span className="font-bold text-slate-900">
                          {st.phone}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMapStoreId(st.id);
                        setActiveSubmodule("map");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 px-3.5 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-200"
                    >
                      <Navigation className="size-3.5 text-[#DC2626]" />
                      <span>Ver en Mapa</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleOpenEdit(st)}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-blue-800 shadow-[0_3px_0_rgba(30,64,175,0.18)] hover:bg-blue-100"
                      >
                        <Edit3 className="size-3.5" />
                        <span>Editar</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDeleteTarget(st)}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#DC2626] shadow-[0_3px_0_rgba(185,28,28,0.16)] hover:bg-red-100"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Eliminar</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600">
                      <th className="px-5 py-4">Tienda / Código</th>
                      <th className="px-4 py-4">Distrito y Región</th>
                      <th className="px-4 py-4">Dirección Exacta</th>
                      <th className="px-4 py-4">Horario / Teléfono</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStores.map((st) => (
                      <tr
                        key={st.id}
                        className="transition-colors hover:bg-red-50/30"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-extrabold text-slate-900">
                            {st.name}
                          </p>
                          <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[0.62rem] font-bold text-slate-600">
                            {st.code}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-800">
                          <p>{st.district}</p>
                          <p className="text-slate-500">
                            {st.province}, {st.department}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <p className="font-bold text-slate-900">
                            {st.address}
                          </p>
                          {st.reference && (
                            <p className="text-slate-500">
                              Ref: {st.reference}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                          <p>{st.openingHours}</p>
                          {st.phone && (
                            <p className="font-bold text-slate-900">
                              {st.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {st.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[0.68rem] font-extrabold text-emerald-800">
                              <CheckCircle2 className="size-3 text-emerald-600" />
                              Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[0.68rem] font-extrabold text-slate-600">
                              <XCircle className="size-3" />
                              Inactiva
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMapStoreId(st.id);
                                setActiveSubmodule("map");
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase text-slate-700 hover:bg-slate-200"
                            >
                              <Navigation className="size-3 text-[#DC2626]" />
                              <span>Mapa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(st)}
                              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase text-blue-800 hover:bg-blue-100"
                            >
                              <Edit3 className="size-3" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(st)}
                              className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase text-[#DC2626] hover:bg-red-100"
                            >
                              <Trash2 className="size-3" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* SUBMÓDULO 2: VER TIENDAS EN EL MAPA CON BUSCADOR SUPERIOR */}
      {activeSubmodule === "map" && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)] sm:p-6"
        >
          {/* Buscador superior de tiendas registradas */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-sans text-xl font-black tracking-tight text-slate-900">
                Mapa de Nuestras Tiendas Agregadas ({stores.length})
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Busca y selecciona cualquiera de tus tiendas para ir directo a
                su ubicación exacta en el mapa.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={mapSearchQuery}
                onChange={(e) => {
                  setMapSearchQuery(e.target.value);
                  setMapPage(1);
                }}
                placeholder="Buscar tienda agregada por nombre, distrito o calle..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Selector paginado (máx 6 tiendas por hoja o resultado de búsqueda) */}
          {(() => {
            const perPage = 6;
            const totalMapPages = Math.max(
              1,
              Math.ceil(mapMatchingStores.length / perPage),
            );
            const currentMapPage = Math.min(mapPage, totalMapPages);
            const visibleMapPills = mapMatchingStores.slice(
              (currentMapPage - 1) * perPage,
              currentMapPage * perPage,
            );
            const activeStoreObj =
              stores.find((s) => s.id === selectedMapStoreId) ?? null;

            return (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <MapPin className="size-4 text-[#DC2626]" />
                    {activeStoreObj ? (
                      <span>
                        Viendo en el mapa:{" "}
                        <strong className="font-black text-slate-900">
                          {activeStoreObj.name}
                        </strong>{" "}
                        ({activeStoreObj.district})
                      </span>
                    ) : (
                      <span>
                        Selecciona una tienda para ir a su ubicación en el mapa
                      </span>
                    )}
                  </div>

                  {totalMapPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <span className="mr-1 text-[0.7rem] font-bold text-slate-500">
                        Pág. {currentMapPage} de {totalMapPages} (
                        {mapMatchingStores.length})
                      </span>
                      <button
                        type="button"
                        disabled={currentMapPage <= 1}
                        onClick={() =>
                          setMapPage((p) => Math.max(1, p - 1))
                        }
                        aria-label="Página anterior de tiendas"
                        className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={currentMapPage >= totalMapPages}
                        onClick={() =>
                          setMapPage((p) => Math.min(totalMapPages, p + 1))
                        }
                        aria-label="Página siguiente de tiendas"
                        className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                {visibleMapPills.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs font-bold text-slate-500">
                    Ninguna tienda coincide con &ldquo;{mapSearchQuery}&rdquo;.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {visibleMapPills.map((st) => {
                      const selected = selectedMapStoreId === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSelectedMapStoreId(st.id)}
                          className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-extrabold transition ${
                            selected
                              ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-sm"
                              : "border-slate-200 bg-slate-50 text-slate-800 hover:border-red-300 hover:bg-red-50/50"
                          }`}
                        >
                          <MapPin className="size-3.5" />
                          <span>{st.name}</span>
                          <span
                            className={`rounded-lg px-1.5 py-0.5 text-[0.6rem] ${
                              selected
                                ? "bg-white/25 text-white"
                                : "bg-slate-200"
                            }`}
                          >
                            {st.district}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          <InteractiveStoresMapViewer
            stores={stores}
            selectedStoreId={selectedMapStoreId}
            onSelectStore={(st) => setSelectedMapStoreId(st.id)}
          />
        </motion.section>
      )}

      {/* MODAL MODERNO CON FONDO NUBLADO PARA CREAR / EDITAR + SELECTOR EN MAPA */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                    <Store className="size-3.5" />
                    {editingStoreId
                      ? "Editar Tienda de Recojo"
                      : "Registrar Nueva Tienda de Recojo"}
                  </span>
                  <h2 className="mt-2 font-sans text-2xl font-black tracking-tight text-slate-900">
                    {editingStoreId
                      ? "Actualizar Datos y Ubicación en el Mapa"
                      : "Nueva Sucursal American Colt"}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Busca la dirección directamente en el mapa o escribe los
                    datos manualmente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                {/* BUSCADOR Y MAPA INTERACTIVO */}
                <InteractiveMapPicker
                  lat={formLat}
                  lng={formLng}
                  addressQuery={`${formAddress} ${formDist} ${formDept}`.trim()}
                  onSelectLocation={handleMapPickLocation}
                  heightClassName="h-64 sm:h-72"
                />

                {/* CAMPOS DEL FORMULARIO */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Nombre de la Tienda *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej: Tienda Central Gamarra — Galería Guizado"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Departamento *
                    </label>
                    <select
                      value={formDept}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Provincia *
                    </label>
                    <select
                      value={formProv}
                      onChange={(e) => handleProvChange(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                    >
                      {provinces.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Distrito *
                    </label>
                    <select
                      value={formDist}
                      onChange={(e) => setFormDist(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                    >
                      {districts.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Dirección Exacta (Av. / Calle / Galería / Stand) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Ej: Jr. Antonio Bazo 720, Tda. 104 — Galería El Rey"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Referencia (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formReference}
                      onChange={(e) => setFormReference(e.target.value)}
                      placeholder="Ej: A 1 cdra. del Parque Cánepa"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="926 922 583"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Horario de Atención
                    </label>
                    <input
                      type="text"
                      value={formHours}
                      onChange={(e) => setFormHours(e.target.value)}
                      placeholder="Lunes a Sábado: 10:00 am - 8:00 pm"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      <span>Enlace Google Maps</span>
                      {formMapsUrl && (
                        <a
                          href={formMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[0.65rem] text-blue-600 hover:underline"
                        >
                          Probar <ExternalLink className="size-3" />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={formMapsUrl}
                      onChange={(e) => setFormMapsUrl(e.target.value)}
                      placeholder="Se llena automático al marcar en el mapa"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs font-medium text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <button
                      type="button"
                      onClick={() => setFormIsActive((v) => !v)}
                      aria-pressed={formIsActive}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-xs font-extrabold transition ${
                        formIsActive
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-slate-300 bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span>
                        {formIsActive
                          ? "Tienda Activa (Visible en la tienda web, mapa público y checkout)"
                          : "Tienda Pausada (Oculta temporalmente)"}
                      </span>
                      <span
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          formIsActive ? "bg-emerald-600" : "bg-slate-400"
                        }`}
                      >
                        <span
                          className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
                            formIsActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_5px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    <span>
                      {editingStoreId ? "Guardar Cambios" : "Guardar Tienda"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL MODERNO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-[#DC2626]">
                  <ShieldAlert className="size-6" />
                </span>
                <div>
                  <h3 className="font-sans text-lg font-black text-slate-900">
                    ¿Eliminar Tienda de Recojo?
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {deleteTarget.district}, {deleteTarget.department}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                Estás a punto de eliminar{" "}
                <strong className="font-extrabold text-slate-900">
                  {deleteTarget.name}
                </strong>
                . Los clientes dejarán de verla en el mapa público y en la
                opción de recojo en tienda.
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={confirmDelete}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  <span>Sí, Eliminar</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
