"use client";

import { useActionState, useState, useTransition } from "react";
import { createAddressAction, deleteAddressAction, setDefaultAddressAction } from "@/server/actions/account";
import type { ActionResult } from "@/server/actions/auth";
import { Plus, Trash2, MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <h2 className="font-display text-xl text-ink">Libreta de direcciones</h2>
          <p className="mt-1 text-xs text-taupe-500">
            Administra los domicilios de envío para tus compras en INVESTMENTS.
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 bg-ink px-4 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-cochinilla"
          >
            <Plus className="size-3.5" aria-hidden />
            Nueva dirección
          </button>
        )}
      </div>

      {showAddForm && (
        <form action={formAction} className="border border-ink/15 bg-paper p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">Agregar nueva dirección</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-taupe-500 hover:text-ink"
            >
              Cancelar
            </button>
          </div>

          {createState.error && (
            <div className="flex items-start gap-2 border-l-2 border-cochinilla bg-cochinilla/5 p-3 text-xs text-cochinilla">
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
              <span>{createState.error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
                Etiqueta (ej: Casa, Oficina)
              </label>
              <input
                name="title"
                type="text"
                defaultValue="Casa"
                required
                className="mt-1.5 block w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
                Nombre de quien recibe
              </label>
              <input
                name="recipientName"
                type="text"
                required
                placeholder="Nombre y Apellidos"
                className="mt-1.5 block w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">Teléfono de contacto</label>
              <input
                name="recipientPhone"
                type="tel"
                required
                placeholder="987 654 321"
                className="mt-1.5 block w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">Departamento</label>
              <input
                name="department"
                type="text"
                required
                defaultValue="Lima"
                className="mt-1.5 block w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">Provincia / Distrito</label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <input
                  name="province"
                  type="text"
                  required
                  defaultValue="Lima"
                  placeholder="Provincia"
                  className="block w-full border border-ink/20 bg-transparent px-2.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
                <input
                  name="district"
                  type="text"
                  required
                  placeholder="Miraflores"
                  className="block w-full border border-ink/20 bg-transparent px-2.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Dirección de entrega (Calle, Av., Jr., Número)
            </label>
            <input
              name="addressLine1"
              type="text"
              required
              placeholder="Av. José Larco 1234"
              className="mt-1.5 block w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
                Dpto., Interior, Oficina (Opcional)
              </label>
              <input
                name="addressLine2"
                type="text"
                placeholder="Dpto. 502"
                className="mt-1.5 block w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
                Referencia (Opcional)
              </label>
              <input
                name="reference"
                type="text"
                placeholder="Frente al parque o esquina"
                className="mt-1.5 block w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="isDefault"
              name="isDefault"
              type="checkbox"
              className="size-4 rounded-none border-ink/30 text-ink focus:ring-ink"
            />
            <label htmlFor="isDefault" className="text-xs text-taupe-700 cursor-pointer">
              Establecer como dirección de entrega predeterminada
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-taupe-600 hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-2 bg-ink px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-60"
            >
              {isCreating ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {isCreating ? "Guardando..." : "Guardar dirección"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de direcciones existentes */}
      {addresses.length === 0 && !showAddForm ? (
        <div className="border border-dashed border-ink/20 bg-paper/50 p-12 text-center">
          <MapPin className="mx-auto size-8 text-taupe-400" aria-hidden />
          <p className="mt-3 text-sm font-medium text-ink">Aún no tienes direcciones registradas</p>
          <p className="mt-1 text-xs text-taupe-500">
            Agrega tu primera dirección para agilizar tus futuras compras en INVESTMENTS.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-5 inline-flex items-center gap-2 bg-ink px-4 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-cochinilla"
          >
            <Plus className="size-3.5" aria-hidden />
            Registrar dirección
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative border p-5 transition-shadow bg-paper ${
                addr.isDefault ? "border-ink shadow-sm" : "border-ink/15 hover:border-ink/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs uppercase tracking-[0.12em] text-ink">
                    {addr.title}
                  </span>
                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[0.6rem] font-semibold text-paper">
                      <CheckCircle2 className="size-2.5" /> Predeterminada
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={isSettingDefault && defaultingId === addr.id}
                      className="text-[0.65rem] font-medium uppercase tracking-wider text-taupe-500 underline underline-offset-2 hover:text-ink disabled:opacity-50"
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
                  className="text-taupe-400 hover:text-cochinilla transition-colors p-1"
                >
                  {isDeleting && deletingId === addr.id ? (
                    <Loader2 className="size-4 animate-spin text-cochinilla" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>

              <div className="mt-3 space-y-1 text-xs text-taupe-700 leading-relaxed">
                <p className="font-medium text-ink">{addr.recipientName}</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>
                  {addr.district}, {addr.province}, {addr.department}
                </p>
                {addr.reference && (
                  <p className="text-taupe-500 italic">Ref: {addr.reference}</p>
                )}
                <p className="text-taupe-500 pt-1 font-mono">Telf: {addr.recipientPhone}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
