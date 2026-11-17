"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence } from "motion/react";
import {
  FaCircleCheck,
  FaClock,
  FaFilter,
  FaMagnifyingGlass,
  FaRotateLeft,
  FaRulerCombined,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";
import { SiWhatsapp } from "react-icons/si";
import {
  updateProductReturnStatusAction,
  deleteProductReturnAction,
} from "@/server/actions/returns";
import { cn } from "@/lib/utils";

export interface ExchangeRecord {
  id: number;
  ticketNumber: string;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNumber: string;
  taxDocNumber: string | null;
  requestType: string;
  reason: string;
  currentProductDetails: string;
  requestedProductDetails: string;
  customerNotes: string | null;
  images: string[];
  status: string;
  adminNotes: string | null;
  createdAtIso: string;
  updatedAtIso: string;
}

interface AdminExchangesManagerProps {
  exchanges: ExchangeRecord[];
}

const STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  pending: {
    label: "Pendiente",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  in_review: {
    label: "En Revisión",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  approved: {
    label: "Aprobado",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  completed: {
    label: "Completado",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
  rejected: {
    label: "Rechazado",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
};

export function AdminExchangesManager({ exchanges }: AdminExchangesManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exchanges.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.ticketNumber.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.orderNumber.toLowerCase().includes(q) ||
        item.customerPhone.toLowerCase().includes(q) ||
        item.customerEmail.toLowerCase().includes(q) ||
        item.currentProductDetails.toLowerCase().includes(q)
      );
    });
  }, [exchanges, search, statusFilter]);

  const totalCount = exchanges.length;
  const pendingCount = exchanges.filter((e) => e.status === "pending").length;
  const approvedCount = exchanges.filter((e) => e.status === "approved" || e.status === "in_review").length;
  const completedCount = exchanges.filter((e) => e.status === "completed").length;

  const handleStatusChange = (id: number, newStatus: string, currentNotes?: string | null) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateProductReturnStatusAction({
        id,
        status: newStatus,
        adminNotes: currentNotes ?? "",
      });
      if (res.success) {
        setFeedback({
          type: "ok",
          text: `Solicitud #${id} actualizada a estado ${STATUS_LABELS[newStatus]?.label ?? newStatus}.`,
        });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo actualizar la solicitud." });
      }
    });
  };

  const handleDelete = (id: number, ticket: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el ticket #${ticket}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteProductReturnAction({ id });
      if (res.success) {
        setFeedback({ type: "ok", text: `Solicitud #${ticket} eliminada.` });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo eliminar la solicitud." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Tarjetas KPI de Estado */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-taupe-500">
              Total Solicitudes
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#0055FF]">
              <FaRotateLeft className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-display text-3xl text-ink">{totalCount}</p>
          <p className="mt-1 font-mono text-xs text-taupe-700">Cambios de talla y devoluciones</p>
        </div>

        <div className="rounded-2xl border border-amber-300/40 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-amber-800">
              Pendientes de Revisión
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-200/60 text-amber-900">
              <FaClock className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-display text-3xl text-amber-900">{pendingCount}</p>
          <p className="mt-1 font-mono text-xs text-amber-800 font-bold">Requieren atención rápida</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-[#0055FF]">
              Aprobados / En Proceso
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-[#0055FF]">
              <FaRulerCombined className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-display text-3xl text-[#0055FF]">{approvedCount}</p>
          <p className="mt-1 font-mono text-xs text-slate-600">Coordinando recojo / despacho</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-emerald-800">
              Completados
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FaCircleCheck className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-display text-3xl text-emerald-800">{completedCount}</p>
          <p className="mt-1 font-mono text-xs text-emerald-700">Prenda cambiada con éxito</p>
        </div>
      </div>

      {/* Mensaje de feedback */}
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

      {/* 2. Barra de Búsqueda y Filtro */}
      <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex flex-1 items-center">
          <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 size-3.5 text-taupe-500" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ticket, cliente, número de pedido, teléfono..."
            className="h-10 w-full rounded-xl border border-ink/20 bg-sand-50 pl-9 pr-4 text-xs text-ink outline-none focus:border-[#0055FF] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FaFilter className="size-3 text-taupe-500" aria-hidden />
          <span className="font-mono text-[0.65rem] font-bold uppercase text-taupe-700">Estado:</span>
          {(
            [
              { id: "all", label: `Todos (${totalCount})` },
              { id: "pending", label: `Pendientes (${pendingCount})` },
              { id: "in_review", label: "En Revisión" },
              { id: "approved", label: "Aprobados" },
              { id: "completed", label: "Completados" },
              { id: "rejected", label: "Rechazados" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-mono text-[0.65rem] font-bold uppercase transition-colors",
                statusFilter === tab.id
                  ? "bg-[#0055FF] text-white shadow-2xs"
                  : "bg-sand-50 text-taupe-700 hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Tabla de Solicitudes */}
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FaRotateLeft className="mx-auto size-8 text-taupe-400" aria-hidden />
            <p className="mt-3 font-display text-xl text-ink">
              No se encontraron solicitudes de cambio
            </p>
            <p className="mt-1 text-xs text-taupe-700">
              Cuando un cliente solicite un cambio de talla o modelo desde la web, aparecerá en este panel de inmediato.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 bg-sand-50/70 font-mono text-[0.65rem] font-extrabold uppercase tracking-wider text-taupe-700">
                  <th className="px-4 py-3">Ticket / Fecha</th>
                  <th className="px-4 py-3">Cliente / Contacto</th>
                  <th className="px-4 py-3">N.° Pedido y Boleta</th>
                  <th className="px-4 py-3">Prenda & Cambio Solicitado</th>
                  <th className="px-4 py-3">Fotos Adjuntas</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {filtered.map((item) => {
                  const cleanPhone = item.customerPhone.replace(/\D/g, "");
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`}?text=${encodeURIComponent(
                        `Hola ${item.customerName}, te escribimos de American Colt JEANS™ respecto a tu solicitud de cambio #${item.ticketNumber} para el pedido ${item.orderNumber}.`,
                      )}`
                    : null;

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-sand-50/40">
                      {/* Ticket y Fecha */}
                      <td className="px-4 py-3 align-top">
                        <span className="font-mono text-xs font-black text-[#0055FF]">
                          #{item.ticketNumber}
                        </span>
                        <p className="font-mono text-[0.65rem] text-taupe-500">
                          {new Date(item.createdAtIso).toLocaleString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>

                      {/* Cliente y WhatsApp */}
                      <td className="px-4 py-3 align-top">
                        <p className="font-sans text-xs font-black text-ink">{item.customerName}</p>
                        <a
                          href={`mailto:${item.customerEmail}`}
                          className="font-mono text-[0.65rem] text-taupe-600 hover:underline"
                        >
                          {item.customerEmail}
                        </a>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {item.customerPhone}
                          </span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2 py-0.5 font-mono text-[0.55rem] font-extrabold text-white shadow-2xs hover:scale-105"
                              title="Chatear con el cliente por WhatsApp"
                            >
                              <SiWhatsapp className="size-2.5" aria-hidden />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Pedido y Comprobante */}
                      <td className="px-4 py-3 align-top">
                        <span className="rounded bg-ink/10 px-2 py-0.5 font-mono text-[0.68rem] font-bold text-ink">
                          {item.orderNumber}
                        </span>
                        {item.taxDocNumber && (
                          <p className="mt-1 font-mono text-[0.65rem] text-taupe-600">
                            Doc: {item.taxDocNumber}
                          </p>
                        )}
                      </td>

                      {/* Detalle del Cambio */}
                      <td className="px-4 py-3 align-top max-w-xs">
                        <p className="font-bold text-slate-900 leading-tight">
                          Actual: {item.currentProductDetails}
                        </p>
                        <p className="mt-0.5 font-bold text-[#EF233C] leading-tight">
                          Desea: {item.requestedProductDetails}
                        </p>
                        <p className="mt-1 text-[0.68rem] text-slate-600">
                          <strong className="text-slate-800">Motivo:</strong> {item.reason}
                        </p>
                        {item.customerNotes && (
                          <p className="mt-0.5 text-[0.65rem] text-taupe-500 italic">
                            &ldquo;{item.customerNotes}&rdquo;
                          </p>
                        )}
                      </td>

                      {/* Miniaturas de Fotos */}
                      <td className="px-4 py-3 align-top">
                        {item.images && item.images.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.images.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedPhoto(img)}
                                className="group relative size-10 overflow-hidden rounded-lg border border-slate-300 shadow-2xs hover:border-[#0055FF]"
                                title="Ver foto en tamaño completo"
                              >
                                <Image
                                  src={img}
                                  alt={`Foto ${i + 1}`}
                                  fill
                                  sizes="40px"
                                  className="object-cover transition-transform group-hover:scale-110"
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="font-mono text-[0.65rem] text-taupe-400">Sin fotos</span>
                        )}
                      </td>

                      {/* Selector de Estado */}
                      <td className="px-4 py-3 align-top">
                        <select
                          disabled={isPending}
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value, item.adminNotes)
                          }
                          className={cn(
                            "rounded-xl border px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase outline-none transition-colors",
                            STATUS_LABELS[item.status]?.badgeClass ?? "bg-slate-100 text-slate-800",
                          )}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="in_review">En Revisión</option>
                          <option value="approved">Aprobado</option>
                          <option value="completed">Completado</option>
                          <option value="rejected">Rechazado</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 align-top text-right">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id, item.ticketNumber)}
                          className="rounded-lg border border-rose-300 bg-rose-50 p-2 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
                          title="Eliminar solicitud"
                        >
                          <FaTrashCan className="size-3" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Visor de Fotos en Tamaño Completo */}
      <AnimatePresence>
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="relative max-h-[85vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                aria-label="Cerrar foto"
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-rose-600"
              >
                <FaXmark className="size-4" aria-hidden />
              </button>
              <div className="relative h-[65vh] w-[80vw] max-w-2xl">
                <Image
                  src={selectedPhoto}
                  alt="Foto adjunta en tamaño completo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
