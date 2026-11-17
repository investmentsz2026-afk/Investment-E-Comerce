"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FaCheck,
  FaDownload,
  FaEnvelope,
  FaMagnifyingGlass,
  FaMobileScreenButton,
  FaPlus,
  FaPowerOff,
  FaSpinner,
  FaTrashCan,
  FaUserCheck,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa6";
import { SiWhatsapp } from "react-icons/si";
import {
  deleteNewsletterSubscriberAction,
  subscribeNewsletterAction,
  toggleNewsletterSubscriberStatusAction,
} from "@/server/actions/favorites";
import { cn } from "@/lib/utils";

export interface SubscriberItem {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

interface AdminSubscriptionsManagerProps {
  subscribers: SubscriberItem[];
}

export function AdminSubscriptionsManager({
  subscribers,
}: AdminSubscriptionsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Estado para agregar suscriptor manualmente desde el panel admin
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscribers.filter((sub) => {
      if (statusFilter === "active" && !sub.isActive) return false;
      if (statusFilter === "inactive" && sub.isActive) return false;
      if (!q) return true;
      const fullName = `${sub.firstName} ${sub.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        sub.email.toLowerCase().includes(q) ||
        sub.phone.toLowerCase().includes(q)
      );
    });
  }, [subscribers, search, statusFilter]);

  const totalCount = subscribers.length;
  const activeCount = subscribers.filter((s) => s.isActive).length;
  const withPhoneCount = subscribers.filter((s) => s.phone.trim().length > 0).length;

  const handleToggleStatus = (sub: SubscriberItem) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleNewsletterSubscriberStatusAction({
        id: sub.id,
        isActive: !sub.isActive,
      });
      if (res.success) {
        setFeedback({
          type: "ok",
          text: `Estado de ${sub.email} actualizado a ${!sub.isActive ? "ACTIVO" : "INACTIVO"}.`,
        });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo actualizar el estado." });
      }
    });
  };

  const handleDelete = (sub: SubscriberItem) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteNewsletterSubscriberAction({ id: sub.id });
      if (res.success) {
        setFeedback({
          type: "ok",
          text: `Suscriptor ${sub.email} eliminado correctamente.`,
        });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo eliminar el suscriptor." });
      }
    });
  };

  const handleManualAdd = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await subscribeNewsletterAction({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      if (res.success) {
        setFeedback({
          type: "ok",
          text: `Suscriptor ${email.trim()} registrado / actualizado con éxito.`,
        });
        setFirstName("");
        setLastName("");
        setPhone("");
        setEmail("");
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "Error al registrar suscriptor." });
      }
    });
  };

  const handleExportCsv = () => {
    const headers = ["ID", "Nombre", "Apellido", "Celular", "Correo", "Estado", "Fecha Registro"];
    const rows = filtered.map((s) => [
      String(s.id),
      `"${(s.firstName || "").replace(/"/g, '""')}"`,
      `"${(s.lastName || "").replace(/"/g, '""')}"`,
      `"${(s.phone || "").replace(/"/g, '""')}"`,
      `"${s.email.replace(/"/g, '""')}"`,
      s.isActive ? "Activo" : "Inactivo",
      new Date(s.createdAtIso).toLocaleString("es-PE"),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `suscripciones-american-colt-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Tarjetas de Resumen KPI */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-widest text-taupe-500">
              Total Suscriptores
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#0055FF]">
              <FaUsers className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-display text-3xl text-ink">{totalCount}</p>
          <p className="mt-1 font-mono text-xs text-taupe-700">
            Registrados desde el formulario del Club VIP
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-widest text-taupe-500">
              Suscriptores Activos
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FaUserCheck className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-display text-3xl text-emerald-700">{activeCount}</p>
          <p className="mt-1 font-mono text-xs text-taupe-700">
            Habilitados para campañas de ofertas y correo
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-widest text-taupe-500">
              Con Celular / WhatsApp
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-green-50 text-[#25D366]">
              <SiWhatsapp className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-display text-3xl text-ink">{withPhoneCount}</p>
          <p className="mt-1 font-mono text-xs text-taupe-700">
            Listos para contacto directo por WhatsApp
          </p>
        </div>
      </div>

      {/* 2. Formulario Rápido para Agregar Suscriptor Manualmente */}
      <div className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-xs">
        <div className="mb-3 flex items-center gap-2">
          <FaUserPlus className="size-4 text-[#0055FF]" aria-hidden />
          <h2 className="font-sans text-sm font-black uppercase tracking-wider text-ink">
            Registrar Nuevo Suscriptor Manualmente
          </h2>
        </div>
        <form onSubmit={handleManualAdd} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Nombre (Ej: Carlos)"
            required
            className="h-10 rounded-xl border border-ink/20 bg-sand-50 px-3 text-xs text-ink outline-none focus:border-[#0055FF] focus:bg-white"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Apellido (Ej: Mendoza)"
            required
            className="h-10 rounded-xl border border-ink/20 bg-sand-50 px-3 text-xs text-ink outline-none focus:border-[#0055FF] focus:bg-white"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Celular (Ej: 987 654 321)"
            required
            className="h-10 rounded-xl border border-ink/20 bg-sand-50 px-3 text-xs text-ink outline-none focus:border-[#0055FF] focus:bg-white"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo (Ej: cliente@correo.com)"
            required
            className="h-10 rounded-xl border border-ink/20 bg-sand-50 px-3 text-xs text-ink outline-none focus:border-[#0055FF] focus:bg-white"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-4 font-mono text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition-all hover:from-[#EF233C] hover:to-[#B91C24] disabled:opacity-50"
          >
            {isPending ? (
              <FaSpinner className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <FaPlus className="size-3.5" aria-hidden />
            )}
            <span>Guardar Suscriptor</span>
          </button>
        </form>
      </div>

      {/* Mensaje de confirmación o error */}
      {feedback && (
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-bold",
            feedback.type === "ok"
              ? "border-emerald-500/30 bg-emerald-50 text-emerald-900"
              : "border-rose-500/30 bg-rose-50 text-rose-900",
          )}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-mono text-[0.65rem] uppercase underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 3. Barra de Búsqueda, Filtro y Exportación CSV */}
      <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex flex-1 items-center">
          <FaMagnifyingGlass
            className="pointer-events-none absolute left-3.5 size-3.5 text-taupe-500"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellido, celular o correo electrónico..."
            className="h-10 w-full rounded-xl border border-ink/20 bg-sand-50 pl-9 pr-4 text-xs text-ink outline-none focus:border-[#0055FF] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-ink/15 bg-sand-50 p-1">
            {(
              [
                { id: "all", label: `Todos (${totalCount})` },
                { id: "active", label: `Activos (${activeCount})` },
                { id: "inactive", label: `Inactivos (${totalCount - activeCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-mono text-[0.68rem] font-bold uppercase transition-colors",
                  statusFilter === tab.id
                    ? "bg-[#0055FF] text-white shadow-2xs"
                    : "text-taupe-700 hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink/20 bg-paper px-3.5 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-[#0055FF] hover:text-[#0055FF] disabled:opacity-40"
          >
            <FaDownload className="size-3.5 text-[#0055FF]" aria-hidden />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 4. Tabla de Suscriptores Registrados */}
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FaEnvelope className="mx-auto size-8 text-taupe-400" aria-hidden />
            <p className="mt-3 font-display text-xl text-ink">
              No se encontraron suscriptores registrados
            </p>
            <p className="mt-1 text-xs text-taupe-700">
              Cuando un cliente llene su Nombre, Apellido, Celular y Correo en el pie de página de la tienda, aparecerá aquí inmediatamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 bg-sand-50/70 font-mono text-[0.65rem] font-extrabold uppercase tracking-wider text-taupe-700">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nombre y Apellido</th>
                  <th className="px-4 py-3">Celular / WhatsApp</th>
                  <th className="px-4 py-3">Correo Electrónico</th>
                  <th className="px-4 py-3">Fecha de Registro</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {filtered.map((sub) => {
                  const fullName =
                    `${sub.firstName} ${sub.lastName}`.trim() || "Suscriptor Web";
                  const cleanDigits = sub.phone.replace(/\D/g, "");
                  const waHref = cleanDigits
                    ? `https://wa.me/${cleanDigits.startsWith("51") ? cleanDigits : `51${cleanDigits}`}?text=${encodeURIComponent(
                        `Hola ${sub.firstName || ""}, te escribimos de American Colt JEANS™ por tu suscripción al Club VIP.`,
                      )}`
                    : null;

                  return (
                    <tr key={sub.id} className="transition-colors hover:bg-sand-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-taupe-500">
                        #{sub.id}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-sans text-xs font-extrabold text-ink">
                          {fullName}
                        </p>
                        {(sub.firstName || sub.lastName) && (
                          <p className="font-mono text-[0.65rem] text-taupe-500">
                            Nombre: {sub.firstName || "-"} · Apellido: {sub.lastName || "-"}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sub.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-ink">
                              <FaMobileScreenButton className="size-3 text-[#0055FF]" aria-hidden />
                              {sub.phone}
                            </span>
                            {waHref && (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-0.5 font-mono text-[0.6rem] font-extrabold text-white shadow-2xs transition-transform hover:scale-105"
                                title="Enviar mensaje por WhatsApp"
                              >
                                <SiWhatsapp className="size-3" aria-hidden />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-[0.68rem] text-taupe-400">
                            No especificado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`mailto:${sub.email}`}
                          className="inline-flex items-center gap-1.5 font-mono font-bold text-[#0055FF] hover:text-cochinilla hover:underline"
                        >
                          <FaEnvelope className="size-3" aria-hidden />
                          <span>{sub.email}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3 font-mono text-[0.68rem] text-taupe-700">
                        {new Date(sub.createdAtIso).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {sub.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[0.62rem] font-extrabold uppercase text-emerald-800">
                            <FaCheck className="size-2.5" aria-hidden />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 font-mono text-[0.62rem] font-extrabold uppercase text-slate-700">
                            <span>Inactivo</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggleStatus(sub)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-[0.62rem] font-bold uppercase transition-colors disabled:opacity-50",
                              sub.isActive
                                ? "border-amber-500/30 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                : "border-emerald-500/30 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
                            )}
                            title={sub.isActive ? "Desactivar suscripción" : "Reactivar suscripción"}
                          >
                            <FaPowerOff className="size-2.5" aria-hidden />
                            <span>{sub.isActive ? "Pausar" : "Activar"}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(sub)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-50 px-2.5 py-1 font-mono text-[0.62rem] font-bold uppercase text-rose-800 transition-colors hover:bg-rose-600 hover:text-white disabled:opacity-50"
                            title="Eliminar suscriptor"
                          >
                            <FaTrashCan className="size-2.5" aria-hidden />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
