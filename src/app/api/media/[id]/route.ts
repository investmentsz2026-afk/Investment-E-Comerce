import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { mediaAssets } from "@/server/db/schema";

interface MediaRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: MediaRouteContext) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const db = getDb();
    const [asset] = await db
      .select({
        mimeType: mediaAssets.mimeType,
        dataBase64: mediaAssets.dataBase64,
        fileName: mediaAssets.fileName,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, numericId))
      .limit(1);

    if (!asset) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const buffer = Buffer.from(asset.dataBase64, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[media] Error sirviendo imagen:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
