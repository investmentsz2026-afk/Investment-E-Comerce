"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  UploadCloud,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

interface AdminImageUploadSlotProps {
  title: string;
  subtitle: string;
  required?: boolean;
  recommended?: boolean;
  valueUrl: string | null;
  altText?: string;
  compact?: boolean;
  wide?: boolean;
  onUploaded: (url: string, fileName?: string) => void;
  onRemove?: () => void;
}

/**
 * Optimiza imágenes muy pesadas (> 900 KB) en el navegador manteniendo nitidez
 * y preservando transparencia en PNG, antes de enviarlas al servidor.
 */
async function optimizeImageIfNeeded(file: File, maxDim = 1600): Promise<File> {
  if (file.size <= 900 * 1024 || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const isPng = file.type === "image/png";
      const outputType = isPng ? "image/png" : "image/jpeg";
      const quality = isPng ? undefined : 0.86;

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const ext = isPng ? "png" : "jpg";
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.${ext}`, { type: outputType }));
        },
        outputType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export function AdminImageUploadSlot({
  title,
  subtitle,
  required = false,
  recommended = false,
  valueUrl,
  altText,
  compact = false,
  wide = false,
  onUploaded,
  onRemove,
}: AdminImageUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFile = async (rawFile: File) => {
    setErrorMsg(null);
    const isExtImage = /\.(jpe?g|jfif|png|webp|avif|gif|bmp|heic|heif|tiff?)$/i.test(
      rawFile.name || "",
    );
    if (!rawFile.type.startsWith("image/") && !isExtImage) {
      setErrorMsg("Selecciona un archivo de imagen válido desde tu celular o PC.");
      return;
    }

    setIsUploading(true);
    try {
      const readyFile = await optimizeImageIfNeeded(rawFile, wide ? 2200 : 1600);
      const formData = new FormData();
      formData.append("file", readyFile);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        success?: boolean;
        url?: string;
        fileName?: string;
        error?: string;
      };

      if (!response.ok || !data.success || !data.url) {
        setErrorMsg(data.error ?? "No se pudo subir la imagen.");
        return;
      }

      onUploaded(data.url, data.fileName ?? rawFile.name);
    } catch {
      setErrorMsg("Error de conexión al subir el archivo. Intenta nuevamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const hasImage = Boolean(valueUrl && valueUrl.trim().length > 0);

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border-2 bg-white transition-all duration-200 ${
        isDragging
          ? "border-[#DC2626] bg-red-50/40 shadow-md scale-[1.01]"
          : hasImage
            ? "border-slate-200/90 hover:border-red-300 hover:shadow-md"
            : required
              ? "border-dashed border-red-300/90 bg-red-50/20 hover:border-[#DC2626] hover:bg-red-50/40"
              : "border-dashed border-slate-300/90 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30"
      }`}
    >
      {/* Cabecera de la tarjeta */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-xs font-extrabold text-slate-900">
              {title}
            </span>
            {required ? (
              <span className="rounded-full bg-[#DC2626] px-2 py-0.5 font-mono text-[0.54rem] font-black uppercase tracking-wider text-white shadow-2xs">
                Obligatoria
              </span>
            ) : recommended ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[0.54rem] font-extrabold uppercase tracking-wider text-blue-800">
                Importante · Opcional
              </span>
            ) : (
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 font-mono text-[0.54rem] font-bold uppercase tracking-wider text-slate-600">
                Opcional
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[0.65rem] text-slate-500">{subtitle}</p>
        </div>

        {hasImage && (
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-emerald-600"
            aria-label="Imagen cargada"
          />
        )}
      </div>

      {/* Área de Vista Previa / Selector de Archivos */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex-1 ${
          wide
            ? "aspect-[16/9]"
            : compact
              ? "aspect-[3/3.6]"
              : "aspect-[3/4]"
        } w-full overflow-hidden bg-slate-100/70`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {hasImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={valueUrl!}
              alt={altText || title}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Controles al pasar el mouse (o siempre accesibles abajo) */}
            <div className="absolute inset-x-2 bottom-2 z-10 flex items-center gap-1.5 rounded-xl bg-slate-950/75 p-1.5 backdrop-blur-md shadow-lg">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[0.65rem] font-extrabold text-slate-900 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
              >
                <RefreshCw className="size-3" aria-hidden />
                <span>Cambiar foto</span>
              </button>
              {onRemove && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={onRemove}
                  title="Quitar imagen"
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-600/90 text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-2.5 p-4 text-center transition-colors focus:outline-none"
          >
            <span
              className={`flex size-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-110 ${
                required
                  ? "bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white"
                  : "bg-white text-slate-600 border border-slate-200 group-hover:border-blue-300 group-hover:text-blue-600"
              }`}
            >
              <UploadCloud className="size-6" aria-hidden />
            </span>
            <div className="space-y-0.5">
              <span className="block text-xs font-extrabold text-slate-800">
                Seleccionar archivo
              </span>
              <span className="block text-[0.62rem] text-slate-500">
                o arrastra aquí tu foto
              </span>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 font-mono text-[0.58rem] font-bold text-slate-500 border border-slate-200">
                <ImageIcon className="size-2.5" aria-hidden />
                JPG · PNG · WebP
              </span>
            </div>
          </button>
        )}

        {/* Overlay de subida en progreso */}
        {isUploading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-950/70 text-white backdrop-blur-xs">
            <Loader2 className="size-7 animate-spin text-white" aria-hidden />
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-wider">
              Subiendo foto...
            </span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-1.5 border-t border-red-200 bg-red-50 px-3 py-2 text-[0.66rem] font-semibold text-red-700"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
