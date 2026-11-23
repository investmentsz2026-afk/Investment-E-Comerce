import { NextResponse } from "next/server";

interface NominatimAddress {
  road?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  town?: string;
  city?: string;
  state_district?: string;
  county?: string;
  state?: string;
}

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

function buildShortStreet(addr: NominatimAddress | undefined, displayName: string): string {
  if (!addr) return displayName.split(",").slice(0, 2).join(", ").trim();
  const street = [addr.road, addr.house_number].filter(Boolean).join(" ").trim();
  if (street) return street;
  return displayName.split(",").slice(0, 2).join(", ").trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const latStr = searchParams.get("lat")?.trim();
  const lngStr = searchParams.get("lng")?.trim();

  try {
    if (latStr && lngStr) {
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json({ success: false, error: "Coordenadas inválidas." }, { status: 400 });
      }

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&addressdetails=1&accept-language=es`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "AmericanColtJeans/1.0 (tiendas-peru)",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        return NextResponse.json({ success: false, error: "No se pudo consultar la dirección." }, { status: 502 });
      }

      const data = (await res.json()) as NominatimItem;
      return NextResponse.json({
        success: true,
        result: {
          lat: Number(data.lat ?? lat),
          lng: Number(data.lon ?? lng),
          displayName: data.display_name,
          shortAddress: buildShortStreet(data.address, data.display_name || ""),
          district:
            data.address?.city_district ||
            data.address?.suburb ||
            data.address?.town ||
            data.address?.neighbourhood ||
            "",
          province: data.address?.county || data.address?.city || "",
          department: data.address?.state || "",
        },
      });
    }

    if (q && q.length >= 2) {
      const cleanQuery = q.slice(0, 160);
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(cleanQuery)}&countrycodes=pe&addressdetails=1&limit=6&accept-language=es`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "AmericanColtJeans/1.0 (tiendas-peru)",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        return NextResponse.json({ success: true, results: [] });
      }

      const items = (await res.json()) as NominatimItem[];
      return NextResponse.json({
        success: true,
        results: items.map((item) => ({
          lat: Number(item.lat),
          lng: Number(item.lon),
          displayName: item.display_name,
          shortAddress: buildShortStreet(item.address, item.display_name),
          district:
            item.address?.city_district ||
            item.address?.suburb ||
            item.address?.town ||
            item.address?.neighbourhood ||
            "",
          province: item.address?.county || item.address?.city || "",
          department: item.address?.state || "",
        })),
      });
    }

    return NextResponse.json({ success: true, results: [] });
  } catch {
    return NextResponse.json({ success: true, results: [] });
  }
}
