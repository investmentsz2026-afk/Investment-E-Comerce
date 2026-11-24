"use client";

import { useActionState, useState, useTransition } from "react";
import { createAddressAction, deleteAddressAction, setDefaultAddressAction } from "@/server/actions/account";
import type { ActionResult } from "@/server/actions/auth";
import {
  FaPlus,
  FaTrashCan,
  FaLocationDot,
  FaCircleCheck,
  FaCircleExclamation,
  FaSpinner,
  FaHouse,
} from "react-icons/fa6";

interface Address {
  id: number;
  title: string;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  reference: string | null;
  department: string;
  province: string;
  district: string;
  postalCode: string | null;
  isDefault: boolean;
}

export function AddressList({ addresses }: { addresses: Address[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [createState, formAction, isCreating] = useActionState<ActionResult, FormData>(
    async (prev, formData) => {
      const res = await createAddressAction(prev, formData);
      if (res.success) setShowAddForm(false);
      return res;
    },
    { success: false },
  );

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [defaultingId, setDefaultingId] = useState<number | null>(null);
  const [isSettingDefault, startSetDefault] = useTransition();

  const handleSetDefault = (id: number) => {
    setDefaultingId(id);
    startSetDefault(async () => {
      await setDefaultAddressAction(id);
      setDefaultingId(null);
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta dirección de entrega?")) {
      setDeletingId(id);
      startDelete(async () => {
        await deleteAddressAction(id);
        setDeletingId(null);
      });
    }
  };

  return (
    <div className="space-y-4 text-slate-900 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-3.5 sm:flex-row sm:items-center sm:gap-4 sm:pb-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
            Libreta de Direcciones
          </h2>
          <p className="mt-0.5 text-[0.7rem] text-slate-500 sm:mt-1 sm:text-xs">
            Administra los domicilios para envíos o recojo comercial.
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-xl bg-[#0055FF] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-blue-700 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs"
          >
            <FaPlus className="size-3" aria-hidden />
            <span>Nueva Dirección</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:space-y-5 sm:p-8"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Registrar Nueva Dirección de Entrega
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>

          {createState.error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 font-medium">
              <FaCircleExclamation className="size-4 shrink-0 text-[#EF233C] mt-0.5" aria-hidden />
              <span>{createState.error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Identificador de la dirección *
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="Ej: Casa, Almacén Central, Oficina"
                disabled={isCreating}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nombre de quien recibe *
              </label>
              <input
                name="recipientName"
                type="text"
                required
                placeholder="Nombre y Apellidos completos"
                disabled={isCreating}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Teléfono de contacto para el repartidor *
              </label>
              <input
                name="recipientPhone"
                type="tel"
                required
                placeholder="987 654 321"
                disabled={isCreating}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Departamento *
              </label>
              <input
                name="department"
                type="text"
                required
                defaultValue="Lima"
                disabled={isCreating}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Provincia *
              </label>
              <input
                name="province"
                type="text"
                required
                defaultValue="Lima"
                disabled={isCreating}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Distrito *
              </label>
              <input
                name="district"
                type="text"
                required
                placeholder="Miraflores / La Victoria / Trujillo..."
                disabled={isCreating}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Dirección exacta (Calle, Av., N°, Dpto / Mz / Lote) *
            </label>
            <input
              name="addressLine1"
              type="text"
              required
              placeholder="Av. Larco 450, Dpto 502"
              disabled={isCreating}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Referencia de llegada (Opcional)
            </label>
            <input
              name="reference"
              type="text"
              placeholder="Frente al parque, portón blanco, timbre 2..."
              disabled={isCreating}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isDefault"
                disabled={isCreating}
                className="size-4 rounded border-slate-300 text-[#0055FF] focus:ring-[#0055FF]"
              />
              <span>Establecer como dirección de entrega principal</span>
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0055FF] hover:bg-blue-700 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isCreating ? (
                <>
                  <FaSpinner className="size-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Dirección</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Lista de direcciones existentes */}
      {addresses.length === 0 && !showAddForm ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center sm:p-16 shadow-xs">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-[#0055FF]">
            <FaLocationDot className="size-7" aria-hidden />
          </div>
          <h3 className="mt-4 text-xl font-black uppercase tracking-tight text-slate-900">
            Aún no tienes direcciones registradas
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500 leading-relaxed">
            Agrega tu primera dirección de entrega en Lima o provincias para agilizar tus compras en American Colt JEANS™.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0055FF] hover:bg-blue-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <FaPlus className="size-3" aria-hidden />
              <span>Registrar Primera Dirección</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-2xl border p-5 shadow-xs transition-shadow ${
                addr.isDefault
                  ? "border-[#0055FF] bg-blue-50/20 shadow-sm"
                  : "border-slate-200/80 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <FaHouse className="size-3.5 text-[#0055FF]" aria-hidden />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    {addr.title}
                  </span>
                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-widest text-[#0055FF]">
                      <FaCircleCheck className="size-2.5" /> Principal
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={isSettingDefault && defaultingId === addr.id}
                      className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 underline hover:text-[#0055FF] disabled:opacity-50"
                    >
                      {isSettingDefault && defaultingId === addr.id ? "Guardando..." : "Usar como principal"}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  disabled={isDeleting && deletingId === addr.id}
                  aria-label={`Eliminar dirección ${addr.title}`}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-[#EF233C]"
                >
                  {isDeleting && deletingId === addr.id ? (
                    <FaSpinner className="size-3.5 animate-spin text-red-500" />
                  ) : (
                    <FaTrashCan className="size-3.5" />
                  )}
                </button>
              </div>

              <div className="mt-3.5 space-y-1 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-900 uppercase">{addr.recipientName}</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p className="text-slate-500">{addr.addressLine2}</p>}
                <p className="font-medium text-slate-800">
                  {addr.district}, {addr.province}, {addr.department}
                </p>
                {addr.reference && (
                  <p className="text-slate-500 italic">Ref: {addr.reference}</p>
                )}
                <p className="pt-2 font-mono text-[0.72rem] text-slate-700">
                  Celular: <strong className="text-slate-900">{addr.recipientPhone}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
