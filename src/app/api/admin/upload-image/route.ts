import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { mediaAssets } from "@/server/db/schema";

const ALLOWED_EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  pjpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  heic: "image/heic",
  heif: "image/heif",
  ico: "image/x-icon",
};

const BLOCKED_IMAGE_MIMES = new Set(["image/svg+xml"]);

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(request: Request) {
  try {
    const { session, user } = await getCurrentSession();
    if (!session || !user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Acceso restringido a administradores." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No se recibió ningún archivo de imagen." },
        { status: 400 },
      );
    }

    const ext = (file.name || "").split(".").pop()?.toLowerCase() ?? "";
    const rawMime = (file.type || "").toLowerCase().trim();
    const resolvedMime =
      rawMime && rawMime.startsWith("image/")
        ? rawMime === "image/jpg" || rawMime === "image/pjpeg"
          ? "image/jpeg"
          : rawMime
        : ALLOWED_EXT_MIME[ext] ?? "";

    if (!resolvedMime || !resolvedMime.startsWith("image/") || BLOCKED_IMAGE_MIMES.has(resolvedMime)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Formato no compatible. Selecciona una imagen desde tu celular o PC (JPG, PNG, WebP, HEIC, AVIF, GIF o BMP).",
        },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { success: false, error: "El archivo seleccionado está vacío." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "La imagen excede el límite máximo de 8 MB.",
        },
        { status: 413 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataBase64 = buffer.toString("base64");
    const safeFileName = (file.name || "imagen-producto")
      .replace(/[^\w.\-\s()]/g, "_")
      .slice(0, 240);

    const db = getDb();
    const [inserted] = await db
      .insert(mediaAssets)
      .values({
        fileName: safeFileName,
        mimeType: resolvedMime,
        sizeBytes: buffer.byteLength,
        dataBase64,
        uploadedBy: user.id,
      })
      .returning({ id: mediaAssets.id });

    return NextResponse.json({
      success: true,
      id: inserted.id,
      url: `/api/media/${inserted.id}`,
      fileName: safeFileName,
      sizeBytes: buffer.byteLength,
    });
  } catch (err) {
    console.error("[upload-image] Error al subir imagen:", err);
    return NextResponse.json(
      { success: false, error: "Error interno al guardar la imagen." },
      { status: 500 },
    );
  }
}
