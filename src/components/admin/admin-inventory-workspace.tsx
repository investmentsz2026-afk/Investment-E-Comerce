"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { adminAdjustInventoryAction } from "@/server/actions/admin-commerce";
import {
  validateAdminInventoryAdjustmentInput,
  type AdminInventoryOperationKind,
} from "@/lib/inventory-validation";
import {
  Boxes,
  AlertTriangle,
  Clock,
  History,
  Search,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  ExternalLink,
  Loader2,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Check,
} from "lucide-react";

export interface InventoryVariantRow {
  variant: {
    id: number;
    sku: string;
    size: string | null;
    colorName: string | null;
    colorSwatch: string | null;
    stock: number;
    isActive: boolean;
  };
  productId: number;
  productName: string;
  productSlug: string;
  productStatus: string;
  categoryName: string;
  reservedUnits: number;
  primaryImageUrl: string;
}

export interface InventoryMovementRow {
  movement: {
    id: number;
    variantId: number;
    orderId: number | null;
    skuSnapshot: string;
    movementType: string;
    quantityDelta: number;
    stockBefore: number;
    stockAfter: number;
    notes: string | null;
    createdAt: Date | string;
  };
  productName: string;
  productId: number;
  size: string | null;
  colorName: string | null;
  actorFirstName: string | null;
  actorLastName: string | null;
  actorEmail: string | null;
  orderNumber: string | null;
}

export interface InventoryReservationRow {
  reservation: {
    id: number;
    orderId: number;
    variantId: number;
    skuSnapshot: string;
    quantity: number;
    expiresAt: Date | string;
  };
  orderNumber: string;
}

interface AdminInventoryWorkspaceProps {
  summary: {
    totalVariants: number;
    totalAvailableUnits: number;
    totalReservedUnits: number;
    outOfStockCount: number;
    lowStockCount: number;
  };
  variants: InventoryVariantRow[];
  movements: InventoryMovementRow[];
  activeReservations: InventoryReservationRow[];
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  manual_adjustment: "Ajuste / Entrada / Merma Admin",
  reservation_hold: "Reserva Checkout (Hold)",
  reservation_release: "Liberación de Reserva",
  sale_confirm: "Confirmación de Venta",
  refund_restock: "Reposición por Reembolso",
};

const QUICK_REASONS: Record<AdminInventoryOperationKind, string[]> = {
  entry: [
    "Ingreso de taller / lote nuevo",
    "Reposición de almacén central",
    "Recepción de mercadería según guía",
  ],
  shrinkage: [
    "Prenda observada por control de calidad",
    "Merma / daño en almacén",
    "Salida por muestra comercial",
  ],
  adjustment: [
    "Ajuste por conteo físico de inventario",
    "Corrección de auditoría de almacén",
    "Regularización de sistema vs físico",
  ],
};

const VARIANTS_PAGE_SIZE = 12;
const MOVEMENTS_PAGE_SIZE = 15;

export function AdminInventoryWorkspace({
  summary,
  variants,
  movements,
  activeReservations,
}: AdminInventoryWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Sub-módulos principales
  const [activeTab, setActiveTab] = useState<"stock" | "kardex" | "reservations">(
    "stock",
  );

  // Filtros Sub-módulo Existencias
  const [stockSearch, setStockSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "available" | "low_stock" | "out_of_stock"
  >("all");
  const [stockPage, setStockPage] = useState(1);

  // Filtros Sub-módulo Kardex (Movimientos + Fechas)
  const [kardexSearch, setKardexSearch] = useState("");
  const [kardexType, setKardexType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [kardexPage, setKardexPage] = useState(1);

  // Modal de Ajuste de Stock (Entrada / Salida / Conteo) + Ventana de Confirmación
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"edit" | "confirm">("edit");
  const [modalSearch, setModalSearch] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    variants[0]?.variant.id ?? null,
  );
  const [operationKind, setOperationKind] =
    useState<AdminInventoryOperationKind>("entry");
  const [quantity, setQuantity] = useState<string>("10");
  const [reason, setReason] = useState<string>("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Toast global tras guardar en Kardex
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.variant.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  // Variantes filtradas en el Sub-módulo Existencias
  const filteredVariants = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    return variants.filter((row) => {
      if (stockFilter === "out_of_stock" && row.variant.stock > 0) return false;
      if (
        stockFilter === "low_stock" &&
        (row.variant.stock <= 0 || row.variant.stock > 5)
      ) {
        return false;
      }
      if (stockFilter === "available" && row.variant.stock <= 5) return false;

      if (!q) return true;
      return (
        row.variant.sku.toLowerCase().includes(q) ||
        row.productName.toLowerCase().includes(q) ||
        row.categoryName.toLowerCase().includes(q) ||
        (row.variant.colorName?.toLowerCase().includes(q) ?? false) ||
        (row.variant.size?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [variants, stockSearch, stockFilter]);

  const stockTotalPages = Math.max(
    1,
    Math.ceil(filteredVariants.length / VARIANTS_PAGE_SIZE),
  );
  const safeStockPage = Math.min(stockPage, stockTotalPages);
  const paginatedVariants = useMemo(() => {
    const start = (safeStockPage - 1) * VARIANTS_PAGE_SIZE;
    return filteredVariants.slice(start, start + VARIANTS_PAGE_SIZE);
  }, [filteredVariants, safeStockPage]);

  // Variantes filtradas dentro del Modal buscador
  const modalFilteredVariants = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    if (!q) return variants.slice(0, 60);
    return variants
      .filter(
        (row) =>
          row.variant.sku.toLowerCase().includes(q) ||
          row.productName.toLowerCase().includes(q) ||
          row.categoryName.toLowerCase().includes(q) ||
          (row.variant.colorName?.toLowerCase().includes(q) ?? false) ||
          (row.variant.size?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 60);
  }, [variants, modalSearch]);

  // Movimientos filtrados en Sub-módulo Kardex (por texto, tipo y fechas)
  const filteredMovements = useMemo(() => {
    const q = kardexSearch.trim().toLowerCase();
    const fromBoundary = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toBoundary = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return movements.filter((m) => {
      if (kardexType !== "all" && m.movement.movementType !== kardexType) {
        return false;
      }

      const createdDate = new Date(m.movement.createdAt);
      if (fromBoundary && createdDate < fromBoundary) return false;
      if (toBoundary && createdDate > toBoundary) return false;

      if (!q) return true;
      return (
        m.movement.skuSnapshot.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        (m.movement.notes?.toLowerCase().includes(q) ?? false) ||
        (m.orderNumber?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [movements, kardexSearch, kardexType, dateFrom, dateTo]);

  const kardexTotals = useMemo(() => {
    let entries = 0;
    let exits = 0;
    for (const m of filteredMovements) {
      if (m.movement.quantityDelta > 0) entries += m.movement.quantityDelta;
      else if (m.movement.quantityDelta < 0)
        exits += Math.abs(m.movement.quantityDelta);
    }
    return { entries, exits };
  }, [filteredMovements]);

  const kardexTotalPages = Math.max(
    1,
    Math.ceil(filteredMovements.length / MOVEMENTS_PAGE_SIZE),
  );
  const safeKardexPage = Math.min(kardexPage, kardexTotalPages);
  const paginatedMovements = useMemo(() => {
    const start = (safeKardexPage - 1) * MOVEMENTS_PAGE_SIZE;
    return filteredMovements.slice(start, start + MOVEMENTS_PAGE_SIZE);
  }, [filteredMovements, safeKardexPage]);

  // Previsualización en vivo del stock resultante dentro del modal
  const liveProjection = useMemo(() => {
    if (!selectedVariant) return null;
    const qtyNum = Number(quantity);
    const check = validateAdminInventoryAdjustmentInput({
      operationKind,
      quantity: qtyNum,
      reason: reason.trim() || "preview",
      currentStock: selectedVariant.variant.stock,
    });

    if (!Number.isInteger(qtyNum) || qtyNum === 0) {
      return {
        valid: false,
        delta: 0,
        nextStock: selectedVariant.variant.stock,
        error: "Ingresa una cantidad entera distinta de cero.",
      };
    }

    let delta = qtyNum;
    if (operationKind === "entry") delta = Math.abs(qtyNum);
    else if (operationKind === "shrinkage") delta = -Math.abs(qtyNum);

    const nextStock = selectedVariant.variant.stock + delta;
    return {
      valid: check.valid && reason.trim().length >= 4,
      delta,
      nextStock,
      error: nextStock < 0 ? check.error : undefined,
    };
  }, [selectedVariant, operationKind, quantity, reason]);

  const openStockModal = (
    variantId?: number,
    defaultOp: AdminInventoryOperationKind = "entry",
  ) => {
    setSelectedVariantId(variantId ?? variants[0]?.variant.id ?? null);
    setOperationKind(defaultOp);
    setQuantity(defaultOp === "shrinkage" ? "1" : "10");
    setReason("");
    setModalSearch("");
    setModalError(null);
    setModalStep("edit");
    setModalOpen(true);
  };

  const handleGoToConfirmStep = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedVariant) {
      setModalError("Selecciona primero un producto / variante SKU.");
      return;
    }

    const check = validateAdminInventoryAdjustmentInput({
      operationKind,
      quantity: Number(quantity),
      reason,
      currentStock: selectedVariant.variant.stock,
    });

    if (!check.valid) {
      setModalError(check.error ?? "Revisa los datos ingresados.");
      return;
    }

    setModalStep("confirm");
  };

  const handleConfirmSubmit = () => {
    if (!selectedVariant) return;
    setModalError(null);

    startTransition(async () => {
      const res = await adminAdjustInventoryAction({
        variantId: selectedVariant.variant.id,
        operationKind,
        quantity: Number(quantity),
        reason,
      });

      if (!res.success) {
        setModalError(res.error ?? "No se pudo registrar el movimiento.");
        setModalStep("edit");
        return;
      }

      setModalOpen(false);
      setToast({
        type: "success",
        text:
          res.message ??
          `Stock actualizado correctamente para ${selectedVariant.variant.sku}.`,
      });
      router.refresh();
    });
  };

  const applyDatePreset = (days: number | null) => {
    setKardexPage(1);
    if (days === null) {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    setDateFrom(fmt(start));
    setDateTo(fmt(end));
  };

  const healthyCount = Math.max(
    0,
    summary.totalVariants - summary.lowStockCount - summary.outOfStockCount,
  );

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* ─── Hero Banner Moderno 3D del Módulo de Inventario ─── */}
        <div className="relative overflow-hidden rounded-3xl border border-red-100/90 bg-gradient-to-br from-white via-[#FFF9F9] to-red-50/70 p-6 sm:p-8 shadow-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-red-500/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 left-1/3 size-56 rounded-full bg-blue-500/10 blur-3xl"
          />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-widest text-[#DC2626] shadow-2xs">
                <Boxes className="size-3.5" aria-hidden />
                <span>CONTROL DE ALMACÉN Y KARDEX · SINCRONIZADO CON PRODUCTOS</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Inventario, Stock y Movimientos 3D
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm text-slate-500">
                Todos los productos y variantes que creas en{" "}
                <Link
                  href="/admin/productos"
                  className="font-bold text-[#DC2626] underline underline-offset-2"
                >
                  Productos
                </Link>{" "}
                aparecen aquí automáticamente. Registra ingresos de lote, salidas, mermas, reservas e historial por fecha.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/productos"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
              >
                <Package className="size-4" aria-hidden />
                <span>Ver Productos</span>
              </Link>

              <button
                type="button"
                onClick={() => openStockModal(undefined, "entry")}
                className="bg-flow group inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D,0_12px_25px_-6px_rgba(220,38,38,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0.5 active:shadow-[0_1px_0_#7F1D1D]"
              >
                <Plus
                  className="size-4 transition-transform duration-200 group-hover:rotate-90"
                  aria-hidden
                />
                <span>Registrar Entrada / Salida</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Toast animado de confirmación ─── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              role="status"
              className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-xs font-bold shadow-sm ${
                toast.type === "success"
                  ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white text-emerald-950"
                  : "border-red-200 bg-gradient-to-r from-red-50 to-white text-red-950"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === "success" ? (
                  <CheckCircle2
                    className="size-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-[#DC2626]" aria-hidden />
                )}
                <span>{toast.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar mensaje"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── 5 Tarjetas KPI Interactivas (clic para filtrar rápido) ─── */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("stock");
              setStockFilter("all");
              setStockPage(1);
            }}
            className="group rounded-3xl border border-slate-200/90 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                Variantes SKU
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-transform group-hover:scale-110">
                <Boxes className="size-4" aria-hidden />
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-black text-slate-900">
              {summary.totalVariants}
            </p>
            <p className="mt-0.5 text-[0.68rem] text-slate-500">
              SKUs activos e inactivos
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("stock");
              setStockFilter("available");
              setStockPage(1);
            }}
            className="group rounded-3xl border border-slate-200/90 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-500">
                Stock Total
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 transition-transform group-hover:scale-110">
                <CheckCircle2 className="size-4" aria-hidden />
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-black text-emerald-700">
              {summary.totalAvailableUnits.toLocaleString("es-PE")}
            </p>
            <p className="mt-0.5 text-[0.68rem] text-slate-500">
              {healthyCount} variantes saludables
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("stock");
              setStockFilter("low_stock");
              setStockPage(1);
            }}
            className="group rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/60 to-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-amber-800">
                Stock Bajo (1-5)
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition-transform group-hover:scale-110">
                <AlertTriangle className="size-4" aria-hidden />
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-black text-amber-800">
              {summary.lowStockCount}
            </p>
            <p className="mt-0.5 text-[0.68rem] text-amber-700">
              Clic para ver por reponer
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("stock");
              setStockFilter("out_of_stock");
              setStockPage(1);
            }}
            className="group rounded-3xl border border-red-200/90 bg-gradient-to-br from-red-50/60 to-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                Agotadas (0 uds.)
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-red-100 text-[#DC2626] transition-transform group-hover:scale-110">
                <AlertCircle className="size-4" aria-hidden />
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-black text-[#DC2626]">
              {summary.outOfStockCount}
            </p>
            <p className="mt-0.5 text-[0.68rem] text-red-700">
              Clic para reabastecer
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reservations")}
            className="group rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 to-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-blue-800">
                Reservas Activas
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition-transform group-hover:scale-110">
                <Clock className="size-4" aria-hidden />
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-black text-[#1E40AF]">
              {summary.totalReservedUnits}
            </p>
            <p className="mt-0.5 text-[0.68rem] text-blue-700">
              {activeReservations.length} pedidos en espera
            </p>
          </button>
        </div>

        {/* ─── Selector de Sub-Módulos con Pestañas 3D ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  id: "stock",
                  label: "Existencias y Stock por Producto",
                  count: filteredVariants.length,
                  icon: Boxes,
                },
                {
                  id: "kardex",
                  label: "Historial de Movimientos (Kardex)",
                  count: filteredMovements.length,
                  icon: History,
                },
                {
                  id: "reservations",
                  label: "Reservas de Checkout",
                  count: activeReservations.length,
                  icon: Clock,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-xs font-extrabold transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="inventory-subtab-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] shadow-sm shadow-red-500/25"
                    />
                  )}
                  <Icon className="relative z-10 size-4" aria-hidden />
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={`relative z-10 rounded-full px-2 py-0.5 font-mono text-[0.6rem] font-black ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            <span>Actualizar</span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SUB-MÓDULO 1: EXISTENCIAS EN TIEMPO REAL
            ════════════════════════════════════════════════════════════════ */}
        {activeTab === "stock" && (
          <motion.section
            key="tab-stock"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm"
          >
            {/* Barra de búsqueda + filtros de estado */}
            <div className="space-y-4 border-b border-slate-100 bg-slate-50/70 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-xl">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={stockSearch}
                    onChange={(e) => {
                      setStockSearch(e.target.value);
                      setStockPage(1);
                    }}
                    placeholder="Buscar producto, SKU, categoría, talla o color..."
                    className="h-11 w-full rounded-2xl border-2 border-slate-200/80 bg-white pl-10 pr-9 text-xs font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#DC2626] focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                  {stockSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setStockSearch("");
                        setStockPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: "all", label: "Todas", count: variants.length },
                      {
                        id: "available",
                        label: "Óptimo (>5)",
                        count: variants.filter((v) => v.variant.stock > 5).length,
                      },
                      {
                        id: "low_stock",
                        label: "Stock Bajo (1-5)",
                        count: variants.filter(
                          (v) => v.variant.stock > 0 && v.variant.stock <= 5,
                        ).length,
                      },
                      {
                        id: "out_of_stock",
                        label: "Agotado (0)",
                        count: variants.filter((v) => v.variant.stock <= 0).length,
                      },
                    ] as const
                  ).map((pill) => {
                    const active = stockFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => {
                          setStockFilter(pill.id);
                          setStockPage(1);
                        }}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-extrabold transition-all ${
                          active
                            ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-[#DC2626]"
                        }`}
                      >
                        <span>{pill.label}</span>
                        <span
                          className={`rounded-full px-1.5 font-mono text-[0.6rem] font-black ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {pill.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {paginatedVariants.length === 0 ? (
              <div className="p-14 text-center space-y-3">
                <Boxes className="mx-auto size-10 text-slate-300" aria-hidden />
                <p className="text-base font-black text-slate-900">
                  No hay variantes que coincidan con tu búsqueda
                </p>
                <p className="text-xs text-slate-500">
                  Prueba otro término o limpia los filtros activos.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3.5">Producto</th>
                      <th className="px-4 py-3.5">SKU / Talla / Color</th>
                      <th className="px-4 py-3.5 text-center">Reservado</th>
                      <th className="px-4 py-3.5">Stock Disponible</th>
                      <th className="px-5 py-3.5 text-right">Movimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedVariants.map((row) => {
                      const stockVal = row.variant.stock;
                      const pct = Math.min(100, Math.round((stockVal / 50) * 100));

                      return (
                        <tr
                          key={row.variant.id}
                          className="group transition-colors hover:bg-red-50/25"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/admin/productos/${row.productId}`}
                                className="relative size-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xs"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={row.primaryImageUrl}
                                  alt={row.productName}
                                  className="size-full object-cover"
                                />
                              </Link>
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/productos/${row.productId}`}
                                  className="block truncate text-sm font-extrabold text-slate-900 hover:text-[#DC2626]"
                                >
                                  {row.productName}
                                </Link>
                                <span className="text-[0.66rem] font-semibold text-slate-500">
                                  {row.categoryName}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="inline-block rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-[0.68rem] font-bold text-white">
                              {row.variant.sku}
                            </span>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.7rem] text-slate-600">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                                Talla: {row.variant.size ?? "Única"}
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-semibold">
                                {row.variant.colorSwatch && (
                                  <span
                                    className="size-3 rounded-full border border-black/15"
                                    style={{ backgroundColor: row.variant.colorSwatch }}
                                    aria-hidden
                                  />
                                )}
                                {row.variant.colorName ?? "-"}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-center font-mono">
                            {row.reservedUnits > 0 ? (
                              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[0.68rem] font-bold text-blue-700">
                                {row.reservedUnits} uds.
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="max-w-[160px] space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                {stockVal <= 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 font-mono text-[0.68rem] font-black text-[#DC2626]">
                                    <AlertCircle className="size-3" aria-hidden />
                                    0 uds. · Agotado
                                  </span>
                                ) : stockVal <= 5 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-mono text-[0.68rem] font-black text-amber-800">
                                    <AlertTriangle className="size-3" aria-hidden />
                                    {stockVal} uds. · Bajo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[0.68rem] font-black text-emerald-800">
                                    {stockVal} uds.
                                  </span>
                                )}
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    stockVal <= 0
                                      ? "bg-[#DC2626]"
                                      : stockVal <= 5
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.max(4, pct)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openStockModal(row.variant.id, "entry")}
                                className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50/70 px-3 text-xs font-extrabold text-emerald-800 shadow-[0_2px_0_#A7F3D0] transition-all hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                              >
                                <Plus className="size-3.5" aria-hidden />
                                <span>Ajustar Stock</span>
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

            {/* Paginación de Existencias */}
            {stockTotalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs">
                <span className="font-mono text-slate-500">
                  Página <strong className="text-slate-900">{safeStockPage}</strong> de{" "}
                  <strong className="text-slate-900">{stockTotalPages}</strong> ·{" "}
                  {filteredVariants.length} variantes
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safeStockPage <= 1}
                    onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 font-extrabold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" aria-hidden />
                    <span>Anterior</span>
                  </button>
                  <button
                    type="button"
                    disabled={safeStockPage >= stockTotalPages}
                    onClick={() =>
                      setStockPage((p) => Math.min(stockTotalPages, p + 1))
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 font-extrabold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SUB-MÓDULO 2: HISTORIAL DE MOVIMIENTOS (KARDEX CON FILTRO DE FECHAS)
            ════════════════════════════════════════════════════════════════ */}
        {activeTab === "kardex" && (
          <motion.section
            key="tab-kardex"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm"
          >
            {/* Controles avanzados de filtro de fechas, tipo y búsqueda */}
            <div className="space-y-4 border-b border-slate-100 bg-slate-50/70 p-5">
              <div className="grid gap-3 md:grid-cols-12 items-end">
                <div className="md:col-span-4">
                  <label className="mb-1 block text-[0.66rem] font-extrabold uppercase tracking-wider text-slate-500">
                    Buscar en el Kardex
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <input
                      type="text"
                      value={kardexSearch}
                      onChange={(e) => {
                        setKardexSearch(e.target.value);
                        setKardexPage(1);
                      }}
                      placeholder="SKU, producto, guía o motivo..."
                      className="h-10 w-full rounded-2xl border-2 border-slate-200/80 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#DC2626] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="mb-1 block text-[0.66rem] font-extrabold uppercase tracking-wider text-slate-500">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={kardexType}
                    onChange={(e) => {
                      setKardexType(e.target.value);
                      setKardexPage(1);
                    }}
                    className="h-10 w-full rounded-2xl border-2 border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#DC2626] focus:outline-none"
                  >
                    <option value="all">Todos los movimientos</option>
                    {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[0.66rem] font-extrabold uppercase tracking-wider text-slate-500">
                    Desde Fecha
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setKardexPage(1);
                    }}
                    className="h-10 w-full rounded-2xl border-2 border-slate-200/80 bg-white px-3 font-mono text-xs font-semibold text-slate-800 focus:border-[#DC2626] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[0.66rem] font-extrabold uppercase tracking-wider text-slate-500">
                    Hasta Fecha
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setKardexPage(1);
                    }}
                    className="h-10 w-full rounded-2xl border-2 border-slate-200/80 bg-white px-3 font-mono text-xs font-semibold text-slate-800 focus:border-[#DC2626] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setKardexSearch("");
                      setKardexType("all");
                      setDateFrom("");
                      setDateTo("");
                      setKardexPage(1);
                    }}
                    className="h-10 w-full rounded-2xl border-2 border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Atajos de fecha + Resumen Entradas vs Salidas */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 inline-flex items-center gap-1 text-[0.68rem] font-bold text-slate-500">
                    <Calendar className="size-3.5" aria-hidden />
                    <span>Rango rápido:</span>
                  </span>
                  {[
                    { label: "Hoy", days: 0 },
                    { label: "Últimos 7 días", days: 7 },
                    { label: "Últimos 30 días", days: 30 },
                    { label: "Todo", days: null },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyDatePreset(preset.days)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[0.68rem] font-bold text-slate-600 transition-colors hover:border-[#DC2626] hover:text-[#DC2626]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="rounded-xl bg-emerald-100 px-3 py-1 font-extrabold text-emerald-800">
                    + {kardexTotals.entries} uds. ingresadas
                  </span>
                  <span className="rounded-xl bg-red-100 px-3 py-1 font-extrabold text-[#DC2626]">
                    - {kardexTotals.exits} uds. salidas
                  </span>
                </div>
              </div>
            </div>

            {paginatedMovements.length === 0 ? (
              <div className="p-14 text-center space-y-2">
                <History className="mx-auto size-10 text-slate-300" aria-hidden />
                <p className="text-base font-black text-slate-900">
                  No hay movimientos en ese rango de fechas
                </p>
                <p className="text-xs text-slate-500">
                  Ajusta las fechas o registra una nueva entrada o salida de inventario.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 p-4 sm:p-5 space-y-2.5">
                {paginatedMovements.map((m) => {
                  const isPositive = m.movement.quantityDelta > 0;
                  const isNegative = m.movement.quantityDelta < 0;

                  return (
                    <div
                      key={m.movement.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-red-200 hover:shadow-xs sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                            isPositive
                              ? "bg-emerald-100 text-emerald-700"
                              : isNegative
                                ? "bg-red-100 text-[#DC2626]"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpCircle className="size-5" aria-hidden />
                          ) : isNegative ? (
                            <ArrowDownCircle className="size-5" aria-hidden />
                          ) : (
                            <Sliders className="size-5" aria-hidden />
                          )}
                        </span>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[0.64rem] font-bold text-white">
                              {m.movement.skuSnapshot}
                            </span>
                            <Link
                              href={`/admin/productos/${m.productId}`}
                              className="truncate text-sm font-black text-slate-900 hover:text-[#DC2626]"
                            >
                              {m.productName}
                            </Link>
                            {(m.size || m.colorName) && (
                              <span className="text-[0.68rem] font-semibold text-slate-500">
                                ({m.size ?? "U"} / {m.colorName ?? "-"})
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600">
                            {m.movement.notes ||
                              MOVEMENT_TYPE_LABELS[m.movement.movementType] ||
                              m.movement.movementType}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 font-mono text-[0.64rem] text-slate-400">
                            <span>
                              {new Date(m.movement.createdAt).toLocaleString("es-PE")}
                            </span>
                            <span>·</span>
                            {m.orderNumber && m.movement.orderId ? (
                              <Link
                                href={`/admin/pedidos/${m.movement.orderId}`}
                                className="inline-flex items-center gap-1 font-bold text-[#DC2626] hover:underline"
                              >
                                <span>Pedido {m.orderNumber}</span>
                                <ExternalLink className="size-2.5" aria-hidden />
                              </Link>
                            ) : m.actorEmail ? (
                              <span className="text-slate-600">
                                Operador: {m.actorFirstName ?? ""} ({m.actorEmail})
                              </span>
                            ) : (
                              <span>Sistema automático</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5 sm:border-0 sm:pt-0 sm:flex-col sm:items-end shrink-0">
                        <span
                          className={`rounded-full px-3 py-1 font-mono text-xs font-black ${
                            isPositive
                              ? "bg-emerald-100 text-emerald-800"
                              : isNegative
                                ? "bg-red-100 text-[#DC2626]"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isPositive
                            ? `+${m.movement.quantityDelta}`
                            : m.movement.quantityDelta}{" "}
                          uds.
                        </span>
                        <span className="font-mono text-[0.68rem] font-bold text-slate-500">
                          Stock: {m.movement.stockBefore} →{" "}
                          <strong className="text-slate-900">
                            {m.movement.stockAfter} uds.
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginación del Kardex */}
            {kardexTotalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs">
                <span className="font-mono text-slate-500">
                  Página <strong className="text-slate-900">{safeKardexPage}</strong> de{" "}
                  <strong className="text-slate-900">{kardexTotalPages}</strong> ·{" "}
                  {filteredMovements.length} movimientos
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safeKardexPage <= 1}
                    onClick={() => setKardexPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 font-extrabold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" aria-hidden />
                    <span>Anterior</span>
                  </button>
                  <button
                    type="button"
                    disabled={safeKardexPage >= kardexTotalPages}
                    onClick={() =>
                      setKardexPage((p) => Math.min(kardexTotalPages, p + 1))
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 font-extrabold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SUB-MÓDULO 3: RESERVAS ACTIVAS DE CHECKOUT
            ════════════════════════════════════════════════════════════════ */}
        {activeTab === "reservations" && (
          <motion.section
            key="tab-reservations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm"
          >
            {activeReservations.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Clock className="mx-auto size-10 text-slate-300" aria-hidden />
                <p className="text-base font-black text-slate-900">
                  No hay reservas activas en checkout en este momento
                </p>
                <p className="text-xs text-slate-500">
                  Cuando un cliente inicia un pago pendiente, su stock queda bloqueado temporalmente aquí durante 30 minutos para evitar sobreventas.
                </p>
              </div>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {activeReservations.map((r) => (
                  <div
                    key={r.reservation.id}
                    className="rounded-2xl border-2 border-blue-100 bg-blue-50/40 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                        {r.reservation.skuSnapshot}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-mono text-xs font-black text-blue-800">
                        {r.reservation.quantity} uds.
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-600">
                      Expira:{" "}
                      {new Date(r.reservation.expiresAt).toLocaleTimeString("es-PE")}
                    </p>
                    <Link
                      href={`/admin/pedidos/${r.reservation.orderId}`}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#DC2626] hover:underline"
                    >
                      <span>Ver pedido {r.orderNumber}</span>
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          VENTANA MODAL 3D: BUSCAR PRODUCTO, AJUSTAR STOCK Y CONFIRMAR
          ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 18 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="stock-modal-title"
              className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
              {/* Cabecera roja degradada del modal */}
              <div className="shrink-0 bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 py-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
                      <Boxes className="size-5 text-white" aria-hidden />
                    </span>
                    <div>
                      <p className="font-mono text-[0.6rem] font-extrabold uppercase tracking-widest text-red-100">
                        {modalStep === "edit"
                          ? "MOVIMIENTO DE ALMACÉN Y KARDEX"
                          : "CONFIRMACIÓN OBLIGATORIA"}
                      </p>
                      <h2 id="stock-modal-title" className="text-lg font-black">
                        {modalStep === "edit"
                          ? "Agregar Entrada, Salida o Ajuste de Stock"
                          : "Confirmar Registro en Kardex"}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setModalOpen(false)}
                    aria-label="Cerrar ventana"
                    className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white hover:text-[#DC2626]"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              {modalStep === "edit" ? (
                <form
                  onSubmit={handleGoToConfirmStep}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-12">
                    {/* Columna Izquierda Modal: Buscador y Listado de Productos/Variantes */}
                    <div className="flex flex-col border-b border-slate-200 bg-slate-50/60 p-5 lg:col-span-6 lg:border-b-0 lg:border-r">
                      <label className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600">
                        1. Busca y selecciona el producto / variante *
                      </label>

                      <div className="relative mt-2">
                        <Search
                          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                          aria-hidden
                        />
                        <input
                          type="text"
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          placeholder="Buscar nombre, SKU, talla o color..."
                          className="h-10 w-full rounded-2xl border-2 border-slate-200 bg-white pl-10 pr-8 text-xs font-semibold text-slate-900 focus:border-[#DC2626] focus:outline-none"
                        />
                        {modalSearch && (
                          <button
                            type="button"
                            onClick={() => setModalSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        )}
                      </div>

                      <div className="mt-3 max-h-[320px] flex-1 space-y-2 overflow-y-auto pr-1">
                        {modalFilteredVariants.length === 0 ? (
                          <p className="py-8 text-center text-xs text-slate-500">
                            No se encontraron variantes con &ldquo;{modalSearch}&rdquo;.
                          </p>
                        ) : (
                          modalFilteredVariants.map((item) => {
                            const isSelected = item.variant.id === selectedVariantId;
                            return (
                              <button
                                key={item.variant.id}
                                type="button"
                                onClick={() => setSelectedVariantId(item.variant.id)}
                                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-all ${
                                  isSelected
                                    ? "border-[#DC2626] bg-red-50/70 shadow-xs ring-2 ring-red-500/15"
                                    : "border-slate-200/80 bg-white hover:border-blue-300"
                                }`}
                              >
                                <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.primaryImageUrl}
                                    alt={item.productName}
                                    className="size-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-black text-slate-900">
                                    {item.productName}
                                  </p>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.64rem] text-slate-600">
                                    <span className="font-mono font-bold text-slate-800">
                                      {item.variant.sku}
                                    </span>
                                    <span>·</span>
                                    <span>Talla {item.variant.size ?? "U"}</span>
                                    {item.variant.colorName && (
                                      <span className="inline-flex items-center gap-1">
                                        {item.variant.colorSwatch && (
                                          <span
                                            className="size-2.5 rounded-full border border-black/15"
                                            style={{
                                              backgroundColor: item.variant.colorSwatch,
                                            }}
                                            aria-hidden
                                          />
                                        )}
                                        {item.variant.colorName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.62rem] font-black ${
                                    item.variant.stock <= 0
                                      ? "bg-red-100 text-[#DC2626]"
                                      : item.variant.stock <= 5
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {item.variant.stock} uds.
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Columna Derecha Modal: Operación, Cantidad y Motivo */}
                    <div className="space-y-4 p-5 lg:col-span-6">
                      {/* Tarjeta resumen de la variante elegida */}
                      {selectedVariant && (
                        <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-3">
                          <div className="min-w-0">
                            <span className="font-mono text-[0.6rem] font-extrabold uppercase text-[#DC2626]">
                              VARIANTE SELECCIONADA
                            </span>
                            <p className="truncate text-xs font-black text-slate-900">
                              {selectedVariant.productName}
                            </p>
                            <p className="font-mono text-[0.66rem] text-slate-600">
                              {selectedVariant.variant.sku} · Talla{" "}
                              {selectedVariant.variant.size ?? "U"} ·{" "}
                              {selectedVariant.variant.colorName ?? "-"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[0.6rem] font-bold uppercase text-slate-400">
                              Actual
                            </span>
                            <span className="font-mono text-lg font-black text-slate-900">
                              {selectedVariant.variant.stock} uds.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Selector 3D de tipo de operación */}
                      <div>
                        <label className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600">
                          2. Tipo de movimiento *
                        </label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {(
                            [
                              {
                                id: "entry",
                                label: "Entrada",
                                sub: "+ Stock",
                                icon: ArrowUpCircle,
                                activeClass:
                                  "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20",
                              },
                              {
                                id: "shrinkage",
                                label: "Salida / Merma",
                                sub: "- Stock",
                                icon: ArrowDownCircle,
                                activeClass:
                                  "border-[#DC2626] bg-red-50 text-[#DC2626] ring-2 ring-red-500/20",
                              },
                              {
                                id: "adjustment",
                                label: "Ajuste (+/-)",
                                sub: "Conteo",
                                icon: Sliders,
                                activeClass:
                                  "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20",
                              },
                            ] as const
                          ).map((op) => {
                            const Icon = op.icon;
                            const active = operationKind === op.id;
                            return (
                              <button
                                key={op.id}
                                type="button"
                                onClick={() => setOperationKind(op.id)}
                                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 text-center transition-all ${
                                  active
                                    ? op.activeClass
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <Icon className="size-4.5" aria-hidden />
                                <span className="text-[0.7rem] font-black leading-tight">
                                  {op.label}
                                </span>
                                <span className="font-mono text-[0.58rem] opacity-75">
                                  {op.sub}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cantidad + Proyección en vivo */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="modal-inv-qty"
                            className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600"
                          >
                            3. Cantidad (uds.) *
                          </label>
                          <div className="flex items-center gap-1">
                            {[5, 10, 25, 50].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setQuantity(String(preset))}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[0.64rem] font-bold text-slate-700 hover:border-[#DC2626] hover:text-[#DC2626]"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <input
                          id="modal-inv-qty"
                          type="number"
                          required
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="mt-1.5 h-11 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 font-mono text-base font-black text-slate-900 focus:border-[#DC2626] focus:outline-none"
                        />

                        {liveProjection && selectedVariant && (
                          <div
                            className={`mt-2 flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold ${
                              liveProjection.nextStock < 0
                                ? "border-red-200 bg-red-50 text-red-800"
                                : "border-blue-200/80 bg-blue-50/70 text-blue-950"
                            }`}
                          >
                            <span>Proyección de stock:</span>
                            <span className="font-mono font-black">
                              {selectedVariant.variant.stock} uds.{" "}
                              {liveProjection.delta >= 0
                                ? `+ ${liveProjection.delta}`
                                : `- ${Math.abs(liveProjection.delta)}`}{" "}
                              ={" "}
                              <strong
                                className={
                                  liveProjection.nextStock < 0
                                    ? "text-[#DC2626]"
                                    : "text-emerald-700"
                                }
                              >
                                {liveProjection.nextStock} uds.
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Motivo obligatorio + sugerencias */}
                      <div>
                        <label
                          htmlFor="modal-inv-reason"
                          className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600"
                        >
                          4. Motivo / Guía de Remisión *
                        </label>
                        <input
                          id="modal-inv-reason"
                          type="text"
                          required
                          minLength={4}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Ej: Ingreso de taller Lote #2026-11..."
                          className="mt-1.5 h-11 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-semibold text-slate-900 focus:border-[#DC2626] focus:outline-none"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {QUICK_REASONS[operationKind].map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setReason(sug)}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.62rem] font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>

                      {modalError && (
                        <div
                          role="alert"
                          className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"
                        >
                          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                          <span>{modalError}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pie del Modal (Paso 1) */}
                  <div className="shrink-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="inline-flex h-10 items-center rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] hover:border-slate-400"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="bg-flow inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] transition-all hover:-translate-y-0.5 active:translate-y-0.5"
                    >
                      <span>Revisar y Confirmar</span>
                      <ArrowRight className="size-4" aria-hidden />
                    </button>
                  </div>
                </form>
              ) : (
                /* ─── Paso 2: Ventana Emergente de Confirmación de Kardex ─── */
                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950">
                    <ShieldCheck
                      className="mt-0.5 size-5 shrink-0 text-blue-600"
                      aria-hidden
                    />
                    <p>
                      Verifica el resumen antes de guardar. Este movimiento quedará registrado en el <strong>Kardex auditable</strong> y actualizará de inmediato el stock visible en tienda.
                    </p>
                  </div>

                  {selectedVariant && liveProjection && (
                    <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[0.65rem] font-bold text-white">
                            {selectedVariant.variant.sku}
                          </span>
                          <p className="mt-1 text-sm font-black text-slate-900">
                            {selectedVariant.productName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Talla {selectedVariant.variant.size ?? "U"} · Color{" "}
                            {selectedVariant.variant.colorName ?? "-"}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="block text-[0.65rem] font-extrabold uppercase text-slate-400">
                            Stock Resultante
                          </span>
                          <span className="font-mono text-xl font-black text-slate-900">
                            {selectedVariant.variant.stock} →{" "}
                            <span
                              className={
                                liveProjection.delta >= 0
                                  ? "text-emerald-700"
                                  : "text-[#DC2626]"
                              }
                            >
                              {liveProjection.nextStock} uds.
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-2.5 text-xs text-slate-700">
                        <strong>Motivo registrado:</strong> {reason}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setModalStep("edit")}
                      className="inline-flex h-10 items-center rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] hover:border-slate-400"
                    >
                      Volver a editar
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleConfirmSubmit}
                      className="bg-flow inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          <span>Guardando en Kardex...</span>
                        </>
                      ) : (
                        <>
                          <Check className="size-4" aria-hidden />
                          <span>Sí, Registrar en Kardex</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
