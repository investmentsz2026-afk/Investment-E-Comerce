"use client";

import { useState, useTransition } from "react";
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Search,
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
import { cn } from "@/lib/utils";

interface AdminShippingManagerProps {
  initialZones: ShippingZoneRecord[];
}

export function AdminShippingManager({ initialZones }: AdminShippingManagerProps) {
  const [zones, setZones] = useState<ShippingZoneRecord[]>(initialZones);
  const [isPending, startTransition] = useTransition();

  // Filtro
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  // Formulario de edición o creación
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("Lima");
  const [formProv, setFormProv] = useState("Lima");
  const [formDist, setFormDist] = useState("*");
  const [formRateSoles, setFormRateSoles] = useState("15.00");
  const [formFreeMinSoles, setFormFreeMinSoles] = useState("299.00");
  const [formEstimatedDays, setFormEstimatedDays] = useState("24 a 48 horas hábiles");
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formUnavailableReason, setFormUnavailableReason] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const departments = getPeruDepartments();
  const availableProvinces = getPeruProvinces(formDept);
  const availableDistricts = formProv !== "*" ? getPeruDistricts(formDept, formProv) : [];

  const handleOpenCreate = () => {
    setEditingZoneId(null);
    setFormName("Tarifa Lima Metropolitana");
    setFormDept("Lima");
    setFormProv("Lima");
    setFormDist("*");
    setFormRateSoles("15.00");
    setFormFreeMinSoles("299.00");
    setFormEstimatedDays("24 a 48 horas hábiles");
    setFormIsAvailable(true);
    setFormUnavailableReason("");
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (zone: ShippingZoneRecord) => {
    setEditingZoneId(zone.id);
    setFormName(zone.name);
    setFormDept(zone.department === "*" ? "Lima" : zone.department);
    setFormProv(zone.province ?? "*");
    setFormDist(zone.district ?? "*");
    setFormRateSoles((zone.rateAmount / 100).toFixed(2));
    setFormFreeMinSoles(
      zone.freeShippingMinSubtotal ? (zone.freeShippingMinSubtotal / 100).toFixed(2) : "",
    );
    setFormEstimatedDays(zone.estimatedDaysLabel);
    setFormIsAvailable(zone.isAvailable);
    setFormUnavailableReason(zone.unavailableReason ?? "");
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleDeptChange = (newDept: string) => {
    setFormDept(newDept);
    const provs = getPeruProvinces(newDept);
    const nextProv = provs[0] ?? "*";
    setFormProv(nextProv);
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
      setFeedback({ type: "error", message: "Ingresa una tarifa válida en Soles (ej: 15.00)." });
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
            ? "Tarifa de envío actualizada correctamente en PostgreSQL."
            : "Nueva tarifa de envío agregada al catálogo de checkout.",
        });

        // Actualizar estado local
        const rateAmountCents = Math.round(rateNum * 100);
        const freeShippingMinSubtotal = freeMinNum ? Math.round(freeMinNum * 100) : null;

        if (editingZoneId) {
          setZones((prev) =>
            prev.map((z) =>
              z.id === editingZoneId
                ? {
                    ...z,
                    name: formName,
                    department: formDept,
                    province: formProv,
                    district: formDist,
                    rateAmount: rateAmountCents,
                    freeShippingMinSubtotal,
                    estimatedDaysLabel: formEstimatedDays,
                    isAvailable: formIsAvailable,
                    unavailableReason: formUnavailableReason || null,
                  }
                : z,
            ),
          );
        } else {
          setZones((prev) => [
            ...prev,
            {
              id: res.data!.zoneId,
              code: `ZONE_${formDept.toUpperCase()}_${Date.now()}`,
              name: formName,
              department: formDept,
              province: formProv,
              district: formDist,
              rateAmount: rateAmountCents,
              freeShippingMinSubtotal,
              estimatedDaysLabel: formEstimatedDays,
              isAvailable: formIsAvailable,
              unavailableReason: formUnavailableReason || null,
              sortOrder: 10,
            },
          ]);
        }
        setIsFormOpen(false);
      } else {
        setFeedback({
          type: "error",
          message: res.error ?? "No se pudo guardar la tarifa de envío.",
        });
      }
    });
  };

  const handleDelete = (zoneId: number, zoneName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la tarifa de envío "${zoneName}"?`)) return;

    startTransition(async () => {
      const res = await deleteShippingRateAction(zoneId);
      if (res.success) {
        setZones((prev) => prev.filter((z) => z.id !== zoneId));
        setFeedback({ type: "success", message: `Tarifa "${zoneName}" eliminada correctamente.` });
      } else {
        setFeedback({ type: "error", message: res.error ?? "No se pudo eliminar la tarifa." });
      }
    });
  };

  const filteredZones = zones.filter((z) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      z.name.toLowerCase().includes(q) ||
      z.department.toLowerCase().includes(q) ||
      (z.province && z.province.toLowerCase().includes(q)) ||
      (z.district && z.district.toLowerCase().includes(q));

    const matchesDept = filterDept === "all" || z.department.toLowerCase() === filterDept.toLowerCase();

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 text-neutral-900">
      {/* Encabezado y Métricas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
            <Truck className="size-6 text-[#801323]" />
            Tarifas de Envíos Perú (Departamentos, Provincias y Distritos)
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Administra los costos de despacho para Lima y Provincias. Los cambios se aplican automáticamente en el checkout y la ficha de producto.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#801323] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#6b0f1c] transition-colors"
        >
          <Plus className="size-4" />
          Nueva Tarifa / Distrito
        </button>
      </div>

      {feedback && (
        <div
          className={cn(
            "rounded-xl p-3 text-xs font-medium flex items-center gap-2",
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200",
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : (
            <AlertCircle className="size-4 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Formulario Modal / Acordeón para Nueva Tarifa o Editar */}
      {isFormOpen && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <MapPin className="size-4 text-[#801323]" />
              {editingZoneId ? "Editar Tarifa de Envío" : "Configurar Nueva Tarifa por Distrito o Provincia"}
            </h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-neutral-400 hover:text-black font-semibold"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Nombre descriptivo */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-bold text-neutral-700 mb-1">
                Nombre de la Tarifa / Zona *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Lima Metropolitana, Arequipa Cercado, Trujillo o Provincia"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

            {/* Departamento */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Departamento *
              </label>
              <select
                value={formDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none bg-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Provincia */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Provincia
              </label>
              <select
                value={formProv}
                onChange={(e) => handleProvChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none bg-white"
              >
                <option value="*">Todas las provincias (*)</option>
                {availableProvinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Distrito */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Distrito Específico
              </label>
              <select
                value={formDist}
                onChange={(e) => setFormDist(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none bg-white"
              >
                <option value="*">Todos los distritos (*)</option>
                {availableDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Costo en Soles */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Costo de Envío (PEN S/) *
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                value={formRateSoles}
                onChange={(e) => setFormRateSoles(e.target.value)}
                placeholder="15.00"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-mono font-bold text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

            {/* Envío gratis desde */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Envío Gratis Desde (PEN S/) — Opcional
              </label>
              <input
                type="number"
                step="1.00"
                min="0"
                value={formFreeMinSoles}
                onChange={(e) => setFormFreeMinSoles(e.target.value)}
                placeholder="299.00 (dejar vacío si no aplica)"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-mono text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

            {/* Tiempo estimado */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Tiempo Estimado de Entrega *
              </label>
              <input
                type="text"
                required
                value={formEstimatedDays}
                onChange={(e) => setFormEstimatedDays(e.target.value)}
                placeholder="Ej: 24 a 48 horas hábiles"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

            {/* Disponibilidad */}
            <div className="flex items-center gap-3 pt-4 sm:col-span-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsAvailable}
                  onChange={(e) => setFormIsAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2.5 font-bold text-neutral-800">
                  {formIsAvailable ? "Zona Habilitada para Despacho" : "Zona Deshabilitada / Bloqueada"}
                </span>
              </label>
            </div>

            {!formIsAvailable && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-neutral-700 mb-1">
                  Motivo de No Disponibilidad (se muestra al cliente en checkout si intenta elegir esta zona)
                </label>
                <input
                  type="text"
                  value={formUnavailableReason}
                  onChange={(e) => setFormUnavailableReason(e.target.value)}
                  placeholder="Ej: Temporalmente sin cobertura de courier directo a esta provincia."
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3.5 py-2 text-xs text-neutral-900 focus:border-amber-600 focus:outline-none"
                />
              </div>
            )}

            {/* Botones */}
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl border border-neutral-300 px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-[#801323] px-6 py-2 font-bold text-white shadow-sm hover:bg-[#6b0f1c] disabled:opacity-50 transition-colors"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                <span>{editingZoneId ? "Actualizar Tarifa" : "Guardar Tarifa"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Filtro y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por zona, departamento, provincia o distrito..."
            className="w-full rounded-xl border border-neutral-300 pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none bg-white"
          />
        </div>

        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-xl border border-neutral-300 px-3 py-2.5 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none bg-white"
        >
          <option value="all">Todos los departamentos ({departments.length})</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de Tarifas */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-neutral-700 font-bold border-b border-neutral-200">
              <tr>
                <th className="p-3.5">Nombre / Zona</th>
                <th className="p-3.5">Departamento</th>
                <th className="p-3.5">Provincia</th>
                <th className="p-3.5">Distrito</th>
                <th className="p-3.5 text-right">Tarifa</th>
                <th className="p-3.5 text-right">Gratis Desde</th>
                <th className="p-3.5">Tiempo Estimado</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {filteredZones.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-400">
                    No se encontraron tarifas de envío con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredZones.map((z) => (
                  <tr key={z.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-neutral-900">
                      <div>{z.name}</div>
                      <span className="font-mono text-[0.62rem] text-neutral-400">{z.code}</span>
                    </td>
                    <td className="p-3.5">{z.department === "*" ? "Todo el Perú" : z.department}</td>
                    <td className="p-3.5">{z.province === "*" || !z.province ? "Todas (*)" : z.province}</td>
                    <td className="p-3.5">
                      {z.district === "*" || !z.district ? (
                        <span className="text-neutral-400">Todos (*)</span>
                      ) : (
                        <span className="font-semibold text-neutral-900">{z.district}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#801323]">
                      {formatPEN(z.rateAmount)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-neutral-600">
                      {z.freeShippingMinSubtotal ? formatPEN(z.freeShippingMinSubtotal) : "—"}
                    </td>
                    <td className="p-3.5 text-neutral-600">{z.estimatedDaysLabel}</td>
                    <td className="p-3.5 text-center">
                      {z.isAvailable ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.68rem] font-bold text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[0.68rem] font-bold text-red-800 border border-red-200">
                          <XCircle className="size-3 text-red-600" />
                          Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(z)}
                        className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors"
                        title="Editar tarifa"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(z.id, z.name)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar tarifa"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
