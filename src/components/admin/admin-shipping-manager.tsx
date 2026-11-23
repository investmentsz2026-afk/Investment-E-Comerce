"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Clock,
  ShieldAlert,
  Building2,
  X,
  Save,
} from "lucide-react";
import type { ShippingZoneRecord } from "@/server/shipping/service";
import {
  saveShippingRateAction,
  deleteShippingRateAction,
  type SaveShippingRateInput,
} from "@/server/actions/shipping";
import {
  getPeruDepartments,
  getPeruProvinces,
  getPeruDistricts,
} from "@/data/peru-locations";
import { formatPEN } from "@/lib/format";

type ViewMode = "cards" | "table";
type ScopeFilter = "all" | "lima" | "provinces" | "agencies";

interface AdminShippingManagerProps {
  initialZones: ShippingZoneRecord[];
  /**
   * "all": módulo general de Tarifas de Envío (Lima + Provincias + Agencias)
   * "provinces_only": submódulo dentro de Pedidos (solo Provincias fuera de Lima Metropolitana)
   */
  mode?: "all" | "provinces_only";
}

function isAgencyZone(z: ShippingZoneRecord): boolean {
  return z.code.startsWith("AGENCIA_");
}

function isLimaMetroZone(z: ShippingZoneRecord): boolean {
  if (isAgencyZone(z)) return false;
  const dept = z.department.trim().toLowerCase();
  const prov = (z.province ?? "*").trim().toLowerCase();
  if (dept === "callao") return true;
  if (dept === "lima" && prov === "lima") return true;
  return false;
}

function isProvinceZone(z: ShippingZoneRecord): boolean {
  if (isAgencyZone(z)) return false;
  return !isLimaMetroZone(z);
}

export function AdminShippingManager({
  initialZones,
  mode = "all",
}: AdminShippingManagerProps) {
  const router = useRouter();
  const zones = initialZones;
  const [isPending, startTransition] = useTransition();

  const isProvincesOnlyMode = mode === "provinces_only";

  // Controles de vista y filtros
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>(
    isProvincesOnlyMode ? "provinces" : "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  // Modal de creación / edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);

  // Modal de confirmación de eliminación
  const [deleteTarget, setDeleteTarget] = useState<ShippingZoneRecord | null>(
    null,
  );

  // Campos del modal
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState(
    isProvincesOnlyMode ? "Arequipa" : "Lima",
  );
  const [formProv, setFormProv] = useState(
    isProvincesOnlyMode ? "*" : "Lima",
  );
  const [formDist, setFormDist] = useState("*");
  const [formRateSoles, setFormRateSoles] = useState("15.00");
  const [formFreeMinSoles, setFormFreeMinSoles] = useState("299.00");
  const [formEstimatedDays, setFormEstimatedDays] = useState(
    "24 a 48 horas hábiles",
  );
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formUnavailableReason, setFormUnavailableReason] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const allDepartments = useMemo(() => getPeruDepartments(), []);
  const selectableDepartments = useMemo(() => {
    if (!isProvincesOnlyMode) return allDepartments;
    return allDepartments;
  }, [allDepartments, isProvincesOnlyMode]);

  const availableProvinces = useMemo(() => {
    if (formDept === "*") return [];
    const list = getPeruProvinces(formDept);
    if (isProvincesOnlyMode && formDept === "Lima") {
      // En modo Solo Provincias, excluir Lima Metropolitana (Lima > Lima)
      return list.filter((p) => p.toLowerCase() !== "lima");
    }
    return list;
  }, [formDept, isProvincesOnlyMode]);

  const availableDistricts = useMemo(() => {
    if (formDept === "*" || formProv === "*") return [];
    return getPeruDistricts(formDept, formProv);
  }, [formDept, formProv]);

  // Base visible según modo
  const scopedBaseZones = useMemo(() => {
    if (isProvincesOnlyMode) {
      return zones.filter((z) => isProvinceZone(z));
    }
    return zones;
  }, [zones, isProvincesOnlyMode]);

  // KPIs
  const stats = useMemo(() => {
    const limaCount = zones.filter((z) => isLimaMetroZone(z)).length;
    const provincesCount = zones.filter((z) => isProvinceZone(z)).length;
    const agenciesCount = zones.filter((z) => isAgencyZone(z)).length;
    const blockedCount = scopedBaseZones.filter((z) => !z.isAvailable).length;
    return {
      total: scopedBaseZones.length,
      limaCount,
      provincesCount,
      agenciesCount,
      blockedCount,
    };
  }, [zones, scopedBaseZones]);

  // Filtrado final
  const filteredZones = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedBaseZones.filter((z) => {
      if (!isProvincesOnlyMode) {
        if (scopeFilter === "lima" && !isLimaMetroZone(z)) return false;
        if (scopeFilter === "provinces" && !isProvinceZone(z)) return false;
        if (scopeFilter === "agencies" && !isAgencyZone(z)) return false;
      }

      if (
        filterDept !== "all" &&
        z.department.toLowerCase() !== filterDept.toLowerCase()
      ) {
        return false;
      }

      if (q) {
        const hay = [
          z.name,
          z.code,
          z.department,
          z.province ?? "",
          z.district ?? "",
          z.estimatedDaysLabel,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    scopedBaseZones,
    isProvincesOnlyMode,
    scopeFilter,
    filterDept,
    searchQuery,
  ]);

  const handleOpenCreate = () => {
    setEditingZoneId(null);
    if (isProvincesOnlyMode || scopeFilter === "provinces") {
      setFormName("Envío Provincial");
      setFormDept("Arequipa");
      setFormProv("*");
      setFormDist("*");
      setFormRateSoles("25.00");
      setFormFreeMinSoles("450.00");
      setFormEstimatedDays("2 a 4 días hábiles");
    } else {
      setFormName("Tarifa Lima Metropolitana");
      setFormDept("Lima");
      setFormProv("Lima");
      setFormDist("*");
      setFormRateSoles("15.00");
      setFormFreeMinSoles("299.00");
      setFormEstimatedDays("24 a 48 horas hábiles");
    }
    setFormIsAvailable(true);
    setFormUnavailableReason("");
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (zone: ShippingZoneRecord) => {
    setEditingZoneId(zone.id);
    setFormName(zone.name);
    setFormDept(zone.department || "*");
    setFormProv(zone.province ?? "*");
    setFormDist(zone.district ?? "*");
    setFormRateSoles((zone.rateAmount / 100).toFixed(2));
    setFormFreeMinSoles(
      zone.freeShippingMinSubtotal
        ? (zone.freeShippingMinSubtotal / 100).toFixed(2)
        : "",
    );
    setFormEstimatedDays(zone.estimatedDaysLabel);
    setFormIsAvailable(zone.isAvailable);
    setFormUnavailableReason(zone.unavailableReason ?? "");
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleDeptChange = (newDept: string) => {
    setFormDept(newDept);
    if (newDept === "*") {
      setFormProv("*");
      setFormDist("*");
      return;
    }
    const provs = getPeruProvinces(newDept);
    if (isProvincesOnlyMode && newDept === "Lima") {
      const nonMetro = provs.filter((p) => p.toLowerCase() !== "lima");
      setFormProv(nonMetro[0] ?? "*");
    } else {
      setFormProv(provs[0] ?? "*");
    }
    setFormDist("*");
  };

  const handleProvChange = (newProv: string) => {
    setFormProv(newProv);
    setFormDist("*");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const rateNum = parseFloat(formRateSoles);
    if (isNaN(rateNum) || rateNum < 0) {
      setFeedback({
        type: "error",
        message: "Ingresa una tarifa válida en Soles (ej: 15.00).",
      });
      return;
    }

    const freeMinNum = formFreeMinSoles ? parseFloat(formFreeMinSoles) : null;

    const payload: SaveShippingRateInput = {
      zoneId: editingZoneId,
      name: formName,
      department: formDept,
      province: formProv,
      district: formDist,
      rateSoles: rateNum,
      freeShippingMinSoles: freeMinNum,
      estimatedDaysLabel: formEstimatedDays,
      isAvailable: formIsAvailable,
      unavailableReason: formUnavailableReason,
    };

    startTransition(async () => {
      const res = await saveShippingRateAction(payload);
      if (res.success && res.data) {
        setFeedback({
          type: "success",
          message: editingZoneId
            ? "Tarifa de envío actualizada y sincronizada en catálogo y checkout."
            : "Nueva tarifa de envío agregada al catálogo y checkout.",
        });
        setIsModalOpen(false);
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error ?? "No se pudo guardar la tarifa de envío.",
        });
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    startTransition(async () => {
      const res = await deleteShippingRateAction(target.id);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `Tarifa "${target.name}" eliminada correctamente.`,
        });
        setDeleteTarget(null);
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error ?? "No se pudo eliminar la tarifa.",
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
        <div className="pointer-events-none absolute -bottom-14 left-1/3 size-60 rounded-full bg-black/15 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md">
              <Sparkles className="size-3.5" />
              <span>
                {isProvincesOnlyMode
                  ? "Cobertura Provincial · Fuera de Lima Metropolitana"
                  : "Cobertura Logística Perú · Lima, Provincias y Agencias"}
              </span>
            </div>
            <h2 className="font-sans text-2xl font-black tracking-tight sm:text-3xl">
              {isProvincesOnlyMode
                ? "Tarifas de Envío a Provincias (Fuera de Lima)"
                : "Tarifas de Envíos Perú (Distritos, Provincias y Agencias)"}
            </h2>
            <p className="text-sm font-medium leading-relaxed text-white/90">
              {isProvincesOnlyMode
                ? "Gestiona los destinos y tarifas provinciales fuera de Lima Metropolitana. Todo lo que agregues o deshabilites aquí se refleja en la ficha del producto y en el checkout."
                : "Administra en un solo lugar distritos específicos de Lima, provincias de todo el país y agencias (Olva / Shalom). Usa Editar para abrir el modal y actualizar tarifas."}
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
            <span>
              {isProvincesOnlyMode
                ? "Nueva Tarifa Provincial"
                : "Nueva Tarifa / Distrito"}
            </span>
          </motion.button>
        </div>
      </motion.section>

      {/* KPIS RÁPIDOS (Solo en modo completo /admin/envios) */}
      {!isProvincesOnlyMode && (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setScopeFilter("all")}
            className={`rounded-3xl border bg-white p-4 text-left shadow-[0_12px_28px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
              scopeFilter === "all"
                ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
                : "border-slate-200/80"
            }`}
          >
            <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
              Total Zonas
            </span>
            <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-900">
              {zones.length}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Todo el país
            </p>
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter("lima")}
            className={`rounded-3xl border bg-white p-4 text-left shadow-[0_12px_28px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
              scopeFilter === "lima"
                ? "border-emerald-600 ring-2 ring-emerald-500/20"
                : "border-slate-200/80"
            }`}
          >
            <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-emerald-700">
              Solo Lima (Distritos)
            </span>
            <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-900">
              {stats.limaCount}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Lima Metropolitana y Callao
            </p>
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter("provinces")}
            className={`rounded-3xl border bg-white p-4 text-left shadow-[0_12px_28px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
              scopeFilter === "provinces"
                ? "border-blue-600 ring-2 ring-blue-500/20"
                : "border-slate-200/80"
            }`}
          >
            <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-blue-700">
              Solo Provincias
            </span>
            <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-900">
              {stats.provincesCount}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Fuera de Lima Metro
            </p>
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter("agencies")}
            className={`rounded-3xl border bg-white p-4 text-left shadow-[0_12px_28px_-14px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-1 ${
              scopeFilter === "agencies"
                ? "border-indigo-600 ring-2 ring-indigo-500/20"
                : "border-slate-200/80"
            }`}
          >
            <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-indigo-700">
              Agencias (Olva / Shalom)
            </span>
            <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-900">
              {stats.agenciesCount}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Pausadas: {stats.blockedCount}
            </p>
          </button>
        </section>
      )}

      {/* FEEDBACK ANIMADO */}
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

      {/* BARRA DE HERRAMIENTAS: FILTROS + BUSCADOR + CAMBIO TARJETAS / TABLA */}
      <section className="space-y-3 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_12px_30px_-14px_rgba(15,23,42,0.14)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Píldoras de ámbito en modo completo */}
          {!isProvincesOnlyMode ? (
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: "all", label: "Todas" },
                  { id: "lima", label: "Solo Lima" },
                  { id: "provinces", label: "Solo Provincias" },
                  { id: "agencies", label: "Agencias" },
                ] as const
              ).map((pill) => {
                const active = scopeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setScopeFilter(pill.id)}
                    className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                      active
                        ? "bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-[0_3px_0_#7F1D1D]"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-blue-800">
              <MapPin className="size-4" />
              <span>
                Mostrando solo Provincias fuera de Lima (
                {filteredZones.length})
              </span>
            </div>
          )}

          {/* Switch Vista Tarjetas / Tabla */}
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
              <span>Lista / Tabla</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-8">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre de zona, departamento, provincia o distrito..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#DC2626] focus:bg-white"
            >
              <option value="all">
                Todos los departamentos ({allDepartments.length})
              </option>
              {allDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* CONTENIDO: TARJETAS 3D O TABLA READ-ONLY */}
      {filteredZones.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <MapPin className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-base font-extrabold text-slate-800">
            No se encontraron tarifas con estos filtros
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Crea una nueva zona de envío o limpia tu búsqueda actual.
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredZones.map((z, idx) => (
            <motion.article
              key={z.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.025 }}
              whileHover={{ y: -3 }}
              className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.16)] transition-all hover:border-red-300/70"
            >
              {/* Banda superior 3D */}
              <div
                className={`absolute inset-x-0 top-0 h-1.5 ${
                  z.isAvailable
                    ? isAgencyZone(z)
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600"
                      : "bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C]"
                    : "bg-slate-300"
                }`}
              />

              <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xl bg-slate-900 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-wider text-white">
                      {z.code}
                    </span>
                    {isAgencyZone(z) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-indigo-800">
                        <Building2 className="size-3" />
                        Agencia
                      </span>
                    ) : isLimaMetroZone(z) ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-emerald-800">
                        Lima / Callao
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-blue-800">
                        Provincia
                      </span>
                    )}
                  </div>

                  <h3 className="font-sans text-lg font-extrabold leading-snug text-slate-900">
                    {z.name}
                  </h3>
                </div>

                {z.isAvailable ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-800">
                    <XCircle className="size-3.5 text-[#DC2626]" />
                    Bloqueado
                  </span>
                )}
              </div>

              {/* Ubicación Read-Only */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                <span className="rounded-xl bg-slate-100 px-2.5 py-1">
                  Depto:{" "}
                  <strong className="text-slate-900">
                    {z.department === "*" ? "Todo el Perú" : z.department}
                  </strong>
                </span>
                <span className="rounded-xl bg-slate-100 px-2.5 py-1">
                  Prov:{" "}
                  <strong className="text-slate-900">
                    {z.province === "*" || !z.province
                      ? "Todas"
                      : z.province}
                  </strong>
                </span>
                <span className="rounded-xl bg-slate-100 px-2.5 py-1">
                  Dist:{" "}
                  <strong className="text-slate-900">
                    {z.district === "*" || !z.district
                      ? "Todos"
                      : z.district}
                  </strong>
                </span>
              </div>

              {/* Datos de tarifa Read-Only */}
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <div>
                  <span className="block text-[0.65rem] font-extrabold uppercase text-slate-500">
                    Tarifa
                  </span>
                  <span className="mt-0.5 block text-lg font-black tabular-nums text-[#DC2626]">
                    {formatPEN(z.rateAmount)}
                  </span>
                </div>
                <div>
                  <span className="block text-[0.65rem] font-extrabold uppercase text-slate-500">
                    Gratis desde
                  </span>
                  <span className="mt-0.5 block text-sm font-extrabold tabular-nums text-slate-900">
                    {z.freeShippingMinSubtotal
                      ? formatPEN(z.freeShippingMinSubtotal)
                      : "Sin mínimo"}
                  </span>
                </div>
                <div>
                  <span className="block text-[0.65rem] font-extrabold uppercase text-slate-500">
                    Plazo
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs font-extrabold text-slate-800">
                    <Clock className="size-3.5 shrink-0 text-slate-400" />
                    {z.estimatedDaysLabel}
                  </span>
                </div>
              </div>

              {/* Acciones 3D */}
              <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleOpenEdit(z)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-blue-800 shadow-[0_3px_0_rgba(30,64,175,0.18)] transition hover:border-blue-400 hover:bg-blue-100"
                >
                  <Edit3 className="size-3.5" />
                  <span>Editar</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDeleteTarget(z)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#DC2626] shadow-[0_3px_0_rgba(185,28,28,0.16)] transition hover:border-red-400 hover:bg-red-100"
                >
                  <Trash2 className="size-3.5" />
                  <span>Eliminar</span>
                </motion.button>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        /* VISTA TABLA / LISTA MODERNA 3D READ-ONLY */
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="px-5 py-4">Nombre / Zona</th>
                  <th className="px-4 py-4">Departamento</th>
                  <th className="px-4 py-4">Provincia</th>
                  <th className="px-4 py-4">Distrito</th>
                  <th className="px-4 py-4 text-right">Tarifa</th>
                  <th className="px-4 py-4 text-right">Gratis Desde</th>
                  <th className="px-4 py-4">Tiempo Estimado</th>
                  <th className="px-4 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredZones.map((z) => (
                  <tr
                    key={z.id}
                    className="transition-colors hover:bg-red-50/30"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold text-slate-900">
                        {z.name}
                      </p>
                      <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[0.62rem] font-bold text-slate-600">
                        {z.code}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-800">
                      {z.department === "*" ? "Todo el Perú" : z.department}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                      {z.province === "*" || !z.province
                        ? "Todas (*)"
                        : z.province}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                      {z.district === "*" || !z.district ? (
                        <span className="text-slate-400">Todos (*)</span>
                      ) : (
                        <span className="font-extrabold text-slate-900">
                          {z.district}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-black tabular-nums text-[#DC2626]">
                      {formatPEN(z.rateAmount)}
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-bold tabular-nums text-slate-700">
                      {z.freeShippingMinSubtotal
                        ? formatPEN(z.freeShippingMinSubtotal)
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-700">
                      {z.estimatedDaysLabel}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {z.isAvailable ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[0.68rem] font-extrabold text-emerald-800">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-[0.68rem] font-extrabold text-red-800">
                          <XCircle className="size-3 text-[#DC2626]" />
                          Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(z)}
                          className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase text-blue-800 hover:bg-blue-100"
                        >
                          <Edit3 className="size-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(z)}
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

      {/* MODAL MODERNO 3D: CREAR / EDITAR TARIFA */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 14 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                    <MapPin className="size-3.5" />
                    {editingZoneId
                      ? "Editar Tarifa de Envío"
                      : "Nueva Tarifa de Envío"}
                  </span>
                  <h3 className="mt-2 font-sans text-xl font-black tracking-tight text-slate-900">
                    {editingZoneId
                      ? "Modificar Zona y Tarifa de Despacho"
                      : isProvincesOnlyMode
                        ? "Registrar Nueva Provincia / Región"
                        : "Configurar Tarifa por Distrito o Provincia"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Nombre de la Tarifa / Zona *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Arequipa Metropolitana, Trujillo, Miraflores..."
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
                    <option value="*">Todo el Perú (*)</option>
                    {selectableDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Provincia
                  </label>
                  <select
                    value={formProv}
                    onChange={(e) => handleProvChange(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                  >
                    <option value="*">Todas las provincias (*)</option>
                    {availableProvinces.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Distrito Específico
                  </label>
                  <select
                    value={formDist}
                    onChange={(e) => setFormDist(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                  >
                    <option value="*">Todos los distritos (*)</option>
                    {availableDistricts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Costo de Envío (S/) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={formRateSoles}
                    onChange={(e) => setFormRateSoles(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-black tabular-nums text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Gratis Desde (S/) — Opcional
                  </label>
                  <input
                    type="number"
                    step="1.00"
                    min="0"
                    value={formFreeMinSoles}
                    onChange={(e) => setFormFreeMinSoles(e.target.value)}
                    placeholder="Ej. 299.00"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-bold tabular-nums text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Tiempo Estimado *
                  </label>
                  <input
                    type="text"
                    required
                    value={formEstimatedDays}
                    onChange={(e) => setFormEstimatedDays(e.target.value)}
                    placeholder="Ej: 24 a 48 horas hábiles"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <button
                    type="button"
                    onClick={() => setFormIsAvailable((v) => !v)}
                    aria-pressed={formIsAvailable}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-xs font-extrabold transition ${
                      formIsAvailable
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : "border-red-300 bg-red-50 text-red-900"
                    }`}
                  >
                    <span>
                      {formIsAvailable
                        ? "Zona Habilitada para Despacho (Visible en producto y checkout)"
                        : "Zona Deshabilitada / Bloqueada"}
                    </span>
                    <span
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        formIsAvailable ? "bg-emerald-600" : "bg-red-500"
                      }`}
                    >
                      <span
                        className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
                          formIsAvailable ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </span>
                  </button>
                </div>

                {!formIsAvailable && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-amber-800">
                      Motivo de No Disponibilidad (se muestra en checkout)
                    </label>
                    <input
                      type="text"
                      value={formUnavailableReason}
                      onChange={(e) => setFormUnavailableReason(e.target.value)}
                      placeholder="Ej: Sin cobertura directa temporalmente."
                      className="h-11 w-full rounded-2xl border border-amber-300 bg-amber-50/60 px-3.5 text-xs font-semibold text-slate-900 outline-none focus:border-amber-600"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 sm:col-span-2 lg:col-span-3">
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    <span>
                      {editingZoneId ? "Guardar Cambios" : "Crear Tarifa"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL MODERNO DE CONFIRMACIÓN PARA ELIMINAR TARIFA */}
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
                  <h4 className="font-sans text-lg font-black text-slate-900">
                    ¿Eliminar Tarifa de Envío?
                  </h4>
                  <p className="text-xs font-bold text-slate-500">
                    {deleteTarget.code}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                Estás a punto de eliminar{" "}
                <strong className="font-extrabold text-slate-900">
                  {deleteTarget.name}
                </strong>
                . Esta zona dejará de aparecer en la ficha de productos y en el
                cálculo de envío del checkout.
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
