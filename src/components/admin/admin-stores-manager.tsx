"use client";

import { useState, useTransition } from "react";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
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
import { cn } from "@/lib/utils";

interface AdminStoresManagerProps {
  initialStores: PhysicalStoreRecord[];
}

export function AdminStoresManager({ initialStores }: AdminStoresManagerProps) {
  const [stores, setStores] = useState<PhysicalStoreRecord[]>(initialStores);
  const [isPending, startTransition] = useTransition();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("Lima");
  const [formProv, setFormProv] = useState("Lima");
  const [formDist, setFormDist] = useState("La Victoria");
  const [formAddress, setFormAddress] = useState("");
  const [formReference, setFormReference] = useState("");
  const [formPhone, setFormPhone] = useState("926 922 583");
  const [formHours, setFormHours] = useState("Lunes a Sábado: 10:00 am - 8:00 pm");
  const [formMapsUrl, setFormMapsUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const departments = getPeruDepartments();
  const provinces = getPeruProvinces(formDept);
  const districts = getPeruDistricts(formDept, formProv);

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
    setFormIsActive(true);
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (store: PhysicalStoreRecord) => {
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
    setFormIsActive(store.isActive);
    setFeedback(null);
    setIsFormOpen(true);
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
      googleMapsUrl: formMapsUrl,
      isActive: formIsActive,
    };

    startTransition(async () => {
      const res = await savePhysicalStoreAction(payload);
      if (res.success && res.data) {
        setFeedback({
          type: "success",
          message: editingStoreId
            ? "Tienda física actualizada correctamente en PostgreSQL."
            : "Nueva tienda física creada exitosamente para recojo en tienda.",
        });

        if (editingStoreId) {
          setStores((prev) =>
            prev.map((s) =>
              s.id === editingStoreId
                ? {
                    ...s,
                    name: formName,
                    department: formDept,
                    province: formProv,
                    district: formDist,
                    address: formAddress,
                    reference: formReference || null,
                    phone: formPhone || null,
                    openingHours: formHours,
                    googleMapsUrl: formMapsUrl || null,
                    isActive: formIsActive,
                  }
                : s,
            ),
          );
        } else {
          setStores((prev) => [
            ...prev,
            {
              id: res.data!.storeId,
              code: `TIENDA_${Date.now()}`,
              name: formName,
              department: formDept,
              province: formProv,
              district: formDist,
              address: formAddress,
              reference: formReference || null,
              phone: formPhone || null,
              openingHours: formHours,
              googleMapsUrl: formMapsUrl || null,
              isActive: formIsActive,
              sortOrder: 10,
            },
          ]);
        }
        setIsFormOpen(false);
      } else {
        setFeedback({
          type: "error",
          message: res.error ?? "No se pudo guardar la tienda física.",
        });
      }
    });
  };

  const handleDelete = (storeId: number, storeName: string) => {
    if (!confirm(`¿Eliminar la tienda "${storeName}"? Los clientes ya no podrán elegirla como punto de recojo.`)) return;

    startTransition(async () => {
      const res = await deletePhysicalStoreAction(storeId);
      if (res.success) {
        setStores((prev) => prev.filter((s) => s.id !== storeId));
        setFeedback({ type: "success", message: `Tienda "${storeName}" eliminada.` });
      } else {
        setFeedback({ type: "error", message: res.error ?? "No se pudo eliminar la tienda." });
      }
    });
  };

  return (
    <div className="space-y-6 text-neutral-900">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
            <Store className="size-6 text-[#801323]" />
            Tiendas Físicas Oficiales (Puntos de Recojo American Colt)
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Configura las tiendas donde los clientes pueden retirar sus prendas de forma gratuita. Aparecen en el modal de selección de recojo en tienda del checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#801323] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#6b0f1c] transition-colors"
        >
          <Plus className="size-4" />
          Agregar Tienda de Recojo
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

      {/* Formulario */}
      {isFormOpen && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Store className="size-4 text-[#801323]" />
              {editingStoreId ? "Editar Tienda de Recojo" : "Registrar Nueva Tienda Física de Recojo"}
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
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-bold text-neutral-700 mb-1">
                Nombre de la Tienda *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Tienda Gamarra Flagship — Galería San Pedro"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

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

            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Provincia *
              </label>
              <select
                value={formProv}
                onChange={(e) => handleProvChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none bg-white"
              >
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Distrito *
              </label>
              <select
                value={formDist}
                onChange={(e) => setFormDist(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none bg-white"
              >
                {districts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-neutral-700 mb-1">
                Dirección Exacta (Av. / Jr. / N° / Stand / Piso) *
              </label>
              <input
                type="text"
                required
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Ej: Jr. Gamarra 1043, Int. 204"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="926 922 583"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-neutral-700 mb-1">
                Referencia de Ubicación
              </label>
              <input
                type="text"
                value={formReference}
                onChange={(e) => setFormReference(e.target.value)}
                placeholder="Ej: Frente al Parque Cánepa, a media cuadra de 28 de Julio"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Horario de Atención *
              </label>
              <input
                type="text"
                required
                value={formHours}
                onChange={(e) => setFormHours(e.target.value)}
                placeholder="Lunes a Sábado: 10:00 am - 8:00 pm"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-neutral-700 mb-1">
                Enlace de Google Maps (opcional)
              </label>
              <input
                type="url"
                value={formMapsUrl}
                onChange={(e) => setFormMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:border-[#801323] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 sm:col-span-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2.5 font-bold text-neutral-800">
                  {formIsActive ? "Tienda Activa para Recojo" : "Tienda Inactiva / Pausada"}
                </span>
              </label>
            </div>

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
                <span>{editingStoreId ? "Actualizar Tienda" : "Registrar Tienda"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Tiendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-900 leading-snug">
                    {s.name}
                  </h3>
                  <span className="text-[0.68rem] font-semibold text-[#801323]">
                    {s.district}, {s.department}
                  </span>
                </div>
                {s.isActive ? (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.62rem] font-bold text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Activa
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[0.62rem] font-bold text-neutral-600 border border-neutral-200">
                    <XCircle className="size-3 text-neutral-400" />
                    Pausada
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-neutral-600 pt-1">
                <p className="flex items-start gap-1.5 font-medium text-neutral-800">
                  <MapPin className="size-3.5 text-[#801323] shrink-0 mt-0.5" />
                  <span>{s.address}</span>
                </p>

                {s.reference && (
                  <p className="pl-5 text-[0.7rem] text-neutral-500 italic">
                    Ref: {s.reference}
                  </p>
                )}

                <p className="flex items-center gap-1.5 text-[0.72rem] text-neutral-600 pt-1">
                  <Clock className="size-3 text-neutral-400 shrink-0" />
                  <span>{s.openingHours}</span>
                </p>

                {s.phone && (
                  <p className="flex items-center gap-1.5 text-[0.72rem] text-neutral-600">
                    <Phone className="size-3 text-neutral-400 shrink-0" />
                    <span>{s.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-100">
              {s.googleMapsUrl ? (
                <a
                  href={s.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-[#0055FF] hover:underline"
                >
                  <span>Ver en Maps</span>
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(s)}
                  className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors"
                  title="Editar tienda"
                >
                  <Edit2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id, s.name)}
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                  title="Eliminar tienda"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
