"use client";

import { useEffect, useRef, useState } from "react";
import type LType from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PhysicalStoreRecord } from "@/server/shipping/service";
import { Loader2, MapPin, Navigation, Search, Crosshair } from "lucide-react";

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  shortAddress: string;
  district: string;
  province: string;
  department: string;
}

const DEFAULT_LIMA_CENTER: [number, number] = [-12.0464, -77.0428];

const DEPARTMENT_FALLBACK_COORDS: Record<string, [number, number]> = {
  lima: [-12.0672, -77.0124],
  callao: [-12.0508, -77.1259],
  arequipa: [-16.409, -71.5375],
  cusco: [-13.5319, -71.9675],
  "la libertad": [-8.1116, -79.0288],
  piura: [-5.1945, -80.6328],
  lambayeque: [-6.7714, -79.8409],
  junin: [-12.0651, -75.2049],
  ica: [-14.0678, -75.7286],
  ancash: [-9.5278, -77.5278],
  loreto: [-3.7437, -73.2516],
  tacna: [-18.0066, -70.2463],
  puno: [-15.8402, -70.0219],
  cajamarca: [-7.1617, -78.5128],
};

export function extractCoordsFromMapsUrl(
  url: string | null | undefined,
): [number, number] | null {
  if (!url) return null;
  const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  }
  const queryMatch = url.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) {
    const lat = Number(queryMatch[1]);
    const lng = Number(queryMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  }
  return null;
}

export function getStoreGoogleMapsHref(store: PhysicalStoreRecord): string {
  if (store.googleMapsUrl) return store.googleMapsUrl;
  if (
    typeof store.latitude === "number" &&
    typeof store.longitude === "number"
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
  }
  const query = encodeURIComponent(
    `${store.address}, ${store.district}, ${store.province}, ${store.department}, Perú`,
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function getFallbackCoords(store: PhysicalStoreRecord, index: number): [number, number] {
  const fromUrl = extractCoordsFromMapsUrl(store.googleMapsUrl);
  if (fromUrl) return fromUrl;
  const deptKey = store.department.trim().toLowerCase();
  const base = DEPARTMENT_FALLBACK_COORDS[deptKey] ?? DEFAULT_LIMA_CENTER;
  const offset = (index % 7) * 0.004;
  return [base[0] + offset, base[1] - offset];
}

function createPinHtml(label: string, isHighlighted: boolean): string {
  const bg = isHighlighted
    ? "linear-gradient(135deg,#1E3A8A,#2563EB)"
    : "linear-gradient(135deg,#991B1B,#DC2626)";
  const scale = isHighlighted ? "scale(1.12)" : "scale(1)";
  return `
    <div style="display:flex;flex-direction:column;align-items:center;transform:${scale};transition:transform 0.2s;">
      <div style="background:${bg};color:#fff;font-family:system-ui,sans-serif;font-weight:800;font-size:11px;padding:5px 10px;border-radius:9999px;border:2px solid #fff;box-shadow:0 8px 18px rgba(0,0,0,0.32);white-space:nowrap;">
        ${label.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </div>
      <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${isHighlighted ? "#2563EB" : "#DC2626"};margin-top:-1px;"></div>
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────
// MODO 1: SELECTOR INTERACTIVO DE UBICACIÓN (PARA MODAL ADMIN)
// ──────────────────────────────────────────────────────────────
export function InteractiveMapPicker({
  lat,
  lng,
  addressQuery,
  onSelectLocation,
  heightClassName = "h-72 sm:h-80",
}: {
  lat: number | null;
  lng: number | null;
  addressQuery?: string;
  onSelectLocation: (loc: GeocodeResult) => void;
  heightClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const markerRef = useRef<LType.Marker | null>(null);
  const leafletRef = useRef<typeof LType | null>(null);
  const onSelectRef = useRef(onSelectLocation);
  useEffect(() => {
    onSelectRef.current = onSelectLocation;
  }, [onSelectLocation]);

  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      leafletRef.current = L;
      const initialCoords: [number, number] =
        typeof lat === "number" && typeof lng === "number"
          ? [lat, lng]
          : DEFAULT_LIMA_CENTER;

      const map = L.map(containerRef.current, {
        center: initialCoords,
        zoom: typeof lat === "number" ? 16 : 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "",
        html: createPinHtml("Punto de Tienda", false),
        iconSize: [140, 38],
        iconAnchor: [70, 38],
      });

      if (typeof lat === "number" && typeof lng === "number") {
        markerRef.current = L.marker(initialCoords, { icon: pinIcon }).addTo(
          map,
        );
      }

      map.on("click", async (ev: LType.LeafletMouseEvent) => {
        const clickLat = Number(ev.latlng.lat.toFixed(6));
        const clickLng = Number(ev.latlng.lng.toFixed(6));

        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng], {
            icon: pinIcon,
          }).addTo(map);
        }

        setStatusMsg("Obteniendo dirección del punto seleccionado...");
        try {
          const res = await fetch(
            `/api/geocode?lat=${clickLat}&lng=${clickLng}`,
          );
          const data = (await res.json()) as {
            success?: boolean;
            result?: GeocodeResult;
          };
          if (data.success && data.result) {
            setStatusMsg(data.result.displayName);
            onSelectRef.current(data.result);
            return;
          }
        } catch {
          // fallback abajo
        }
        setStatusMsg(`Coordenadas marcadas: ${clickLat}, ${clickLng}`);
        onSelectRef.current({
          lat: clickLat,
          lng: clickLng,
          displayName: `${clickLat}, ${clickLng}`,
          shortAddress: "",
          district: "",
          province: "",
          department: "",
        });
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Solo inicializar una vez por montaje del modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar pin si lat/lng cambian desde afuera
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || typeof lat !== "number" || typeof lng !== "number") {
      return;
    }

    const pinIcon = L.divIcon({
      className: "",
      html: createPinHtml("Punto de Tienda", false),
      iconSize: [140, 38],
      iconAnchor: [70, 38],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    }
    map.flyTo([lat, lng], 16, { duration: 0.7 });
  }, [lat, lng]);

  const handleSearchPlaces = async (customQuery?: string) => {
    const query = (customQuery ?? searchInput).trim();
    if (query.length < 2) return;
    setSearching(true);
    setResults([]);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as {
        success?: boolean;
        results?: GeocodeResult[];
      };
      const found = data.results ?? [];
      setResults(found);
      if (found.length === 0) {
        setStatusMsg(
          "No encontramos resultados exactos. Puedes hacer clic directo sobre el mapa para marcar el punto.",
        );
      }
    } finally {
      setSearching(false);
    }
  };

  const applySearchResult = (item: GeocodeResult) => {
    setResults([]);
    setSearchInput(item.displayName);
    setStatusMsg(item.displayName);
    onSelectLocation(item);
  };

  return (
    <div className="space-y-2.5 rounded-3xl border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
          <MapPin className="size-3.5" />
          Buscador y Selector Interactivo en Mapa (Haz clic o busca una calle)
        </span>
        {addressQuery && addressQuery.trim().length > 3 && (
          <button
            type="button"
            onClick={() => void handleSearchPlaces(addressQuery)}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-[0.68rem] font-extrabold text-blue-700 hover:bg-blue-100"
          >
            <Crosshair className="size-3" />
            Ubicar dirección escrita
          </button>
        )}
      </div>

      {/* Buscador dentro del mapa */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearchPlaces();
                }
              }}
              placeholder="Buscar calle, avenida, galería o distrito (ej: Jr. Gamarra 1050, La Victoria)..."
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
            />
          </div>
          <button
            type="button"
            disabled={searching}
            onClick={() => void handleSearchPlaces()}
            className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-4 text-xs font-extrabold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            <span>Buscar</span>
          </button>
        </div>

        {/* Lista desplegable de resultados */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-[900] max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {results.map((item, i) => (
              <button
                key={`${item.lat}-${item.lng}-${i}`}
                type="button"
                onClick={() => applySearchResult(item)}
                className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs transition hover:bg-red-50"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#DC2626]" />
                <div>
                  <p className="font-extrabold text-slate-900">
                    {item.shortAddress || item.district || "Ubicación"}
                  </p>
                  <p className="line-clamp-1 text-[0.68rem] font-medium text-slate-500">
                    {item.displayName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contenedor del Mapa */}
      <div
        ref={containerRef}
        className={`relative z-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 ${heightClassName}`}
      />

      {statusMsg && (
        <p className="truncate text-[0.7rem] font-bold text-slate-600">
          {statusMsg}
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MODO 2: VISOR DE SOLO NUESTRAS TIENDAS EN EL MAPA
// ──────────────────────────────────────────────────────────────
export function InteractiveStoresMapViewer({
  stores,
  selectedStoreId,
  onSelectStore,
  heightClassName = "h-[430px] sm:h-[500px]",
}: {
  stores: PhysicalStoreRecord[];
  selectedStoreId: number | null;
  onSelectStore?: (store: PhysicalStoreRecord) => void;
  heightClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const leafletRef = useRef<typeof LType | null>(null);
  const markersMapRef = useRef<Map<number, LType.Marker>>(new Map());
  const onSelectRef = useRef(onSelectStore);
  useEffect(() => {
    onSelectRef.current = onSelectStore;
  }, [onSelectStore]);

  const [resolvedCoords, setResolvedCoords] = useState<
    Record<number, [number, number]>
  >({});

  // Resolver coordenadas de tiendas antiguas sin lat/lng vía geocoding ligero
  useEffect(() => {
    let active = true;
    const missing = stores.filter(
      (s) =>
        (s.latitude === null || s.longitude === null) &&
        !extractCoordsFromMapsUrl(s.googleMapsUrl) &&
        !resolvedCoords[s.id],
    );
    if (missing.length === 0) return;

    async function geocodeMissing() {
      for (const s of missing) {
        if (!active) break;
        const query = `${s.address}, ${s.district}, ${s.department}, Peru`;
        try {
          const res = await fetch(
            `/api/geocode?q=${encodeURIComponent(query)}`,
          );
          const data = (await res.json()) as {
            success?: boolean;
            results?: GeocodeResult[];
          };
          const first = data.results?.[0];
          if (first && active) {
            setResolvedCoords((prev) => ({
              ...prev,
              [s.id]: [first.lat, first.lng],
            }));
          }
        } catch {
          // Usa fallback por departamento/distrito
        }
      }
    }

    void geocodeMissing();
    return () => {
      active = false;
    };
  }, [stores, resolvedCoords]);

  // Inicializar mapa una vez
  useEffect(() => {
    let cancelled = false;

    async function initViewer() {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        center: DEFAULT_LIMA_CENTER,
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    }

    void initViewer();

    const markersMap = markersMapRef.current;

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersMap.clear();
      }
    };
  }, []);

  // Pintar SOLO los pines de las tiendas del admin cada vez que cambian tiendas o selección
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    markersMapRef.current.forEach((m) => m.remove());
    markersMapRef.current.clear();

    const bounds: [number, number][] = [];

    stores.forEach((store, idx) => {
      const coords: [number, number] =
        typeof store.latitude === "number" &&
        typeof store.longitude === "number"
          ? [store.latitude, store.longitude]
          : resolvedCoords[store.id] ?? getFallbackCoords(store, idx);

      bounds.push(coords);
      const isSelected = store.id === selectedStoreId;

      const icon = L.divIcon({
        className: "",
        html: createPinHtml(store.district || store.name, isSelected),
        iconSize: [150, 40],
        iconAnchor: [75, 40],
      });

      const mapsHref = getStoreGoogleMapsHref(store);
      const safeName = store.name.replace(/</g, "&lt;");
      const safeAddr = store.address.replace(/</g, "&lt;");
      const safeDist = `${store.district}, ${store.department}`.replace(/</g, "&lt;");
      const safeHours = store.openingHours.replace(/</g, "&lt;");

      const popupHtml = `
        <div style="font-family:system-ui,sans-serif;min-width:210px;line-height:1.4;">
          <p style="font-weight:900;font-size:13px;color:#0f172a;margin:0 0 4px;">${safeName}</p>
          <p style="font-weight:600;font-size:11px;color:#475569;margin:0 0 3px;">${safeAddr}</p>
          <p style="font-weight:700;font-size:11px;color:#DC2626;margin:0 0 4px;">${safeDist}</p>
          <p style="font-size:11px;color:#64748b;margin:0 0 8px;">Horario: ${safeHours}</p>
          <a href="${mapsHref}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;background:#DC2626;color:#fff;font-weight:800;font-size:11px;padding:6px 10px;border-radius:8px;text-decoration:none;">
            Cómo llegar en Google Maps &rarr;
          </a>
        </div>
      `;

      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(popupHtml);

      marker.on("click", () => {
        onSelectRef.current?.(store);
      });

      markersMapRef.current.set(store.id, marker);

      if (isSelected) {
        map.flyTo(coords, 16, { duration: 0.75 });
        marker.openPopup();
      }
    });

    if (!selectedStoreId && bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      } else {
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
      }
    }
  }, [stores, selectedStoreId, resolvedCoords]);

  const activeStore = stores.find((s) => s.id === selectedStoreId) ?? null;

  return (
    <div className="space-y-3">
      <div
        className={`relative z-0 w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.18)] ${heightClassName}`}
      >
        <div ref={containerRef} className="size-full" />

        {activeStore && (
          <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-md sm:left-4 sm:right-auto sm:max-w-md">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-900">
                {activeStore.name}
              </p>
              <p className="truncate text-[0.7rem] font-semibold text-slate-600">
                {activeStore.address} · {activeStore.district}
              </p>
            </div>
            <a
              href={getStoreGoogleMapsHref(activeStore)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-3 py-2 text-[0.68rem] font-extrabold text-white shadow-sm hover:brightness-110"
            >
              <Navigation className="size-3.5" />
              <span>Abrir Mapa</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
