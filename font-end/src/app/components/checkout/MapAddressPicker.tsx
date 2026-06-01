import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon paths broken by Vite bundler
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ── Constants ────────────────────────────────────────────────────────────────
const HCMC_CENTER: [number, number] = [10.7769, 106.7009];
const HCMC_ZOOM = 13;
const NOMINATIM = "https://nominatim.openstreetmap.org";
const HCMC_VIEWBOX = "106.35,10.40,107.03,11.16"; // west,south,east,north

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

interface Props {
  value: string;
  onChange: (address: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

export default function MapAddressPicker({ value, onChange, onCoordinatesChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reverse geocode (lat/lon → address string) ───────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=vi`,
        { headers: { "Accept-Language": "vi" } }
      );
      const data = await res.json();
      const addr = data.display_name ?? "";
      setQuery(addr);
      onChange(addr);
      onCoordinatesChange?.(lat, lon);
    } catch {
      // silent
    }
  }, [onChange, onCoordinatesChange]);

  // ── Place marker and optionally reverse geocode ───────────────────────────
  const placeMarker = useCallback((lat: number, lon: number, geocode = true) => {
    if (!leafletMap.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      markerRef.current = L.marker([lat, lon], { draggable: true }).addTo(leafletMap.current);
      markerRef.current.on("dragend", (e) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        reverseGeocode(lat, lng);
      });
    }
    if (geocode) reverseGeocode(lat, lon);
  }, [reverseGeocode]);

  // ── Init Leaflet map ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: HCMC_CENTER,
      zoom: HCMC_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng, true);
    });

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search with Nominatim (debounced 450ms) ──────────────────────────────
  const handleQueryChange = (q: string) => {
    setQuery(q);
    onChange(q);
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 3) { setShowSuggestions(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${NOMINATIM}/search?q=${encodeURIComponent(q + ", Hồ Chí Minh")}&format=json&limit=6&viewbox=${HCMC_VIEWBOX}&bounded=0&countrycodes=vn&accept-language=vi`,
          { headers: { "Accept-Language": "vi" } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 450);
  };

  // ── Select suggestion ────────────────────────────────────────────────────
  const selectSuggestion = (item: NominatimResult) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setQuery(item.display_name);
    onChange(item.display_name);
    onCoordinatesChange?.(lat, lon);
    setSuggestions([]);
    setShowSuggestions(false);
    if (leafletMap.current) {
      leafletMap.current.flyTo([lat, lon], 16, { duration: 1 });
      placeMarker(lat, lon, false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center border bg-white" style={{ borderColor: "#d9d9d9", borderRadius: 0 }}>
          <svg className="shrink-0 ml-3" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(48,38,28,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
            placeholder="Tìm địa chỉ tại TP. Hồ Chí Minh..."
            className="font-body w-full bg-transparent outline-none px-3 py-3 text-cafe-primary placeholder:text-[rgba(48,38,28,0.35)]"
            style={{ fontSize: 13 }}
          />
          {loading && (
            <div className="shrink-0 mr-3 w-4 h-4 border-2 border-cafe-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[9999] left-0 right-0 top-full bg-white border border-[#d9d9d9] shadow-lg max-h-56 overflow-y-auto" style={{ borderRadius: 0 }}>
            {suggestions.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onMouseDown={() => selectSuggestion(item)}
                className="font-body w-full text-left px-4 py-2.5 hover:bg-cafe-accent transition-colors border-b border-[#f0ede8] last:border-0"
                style={{ fontSize: 12, color: "#30261c", lineHeight: 1.5 }}
              >
                <span className="flex items-start gap-2">
                  <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(48,38,28,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {item.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        style={{ height: 280, width: "100%", zIndex: 0, border: "1px solid #d9d9d9" }}
      />

      <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)", letterSpacing: "0.3px" }}>
        Tìm kiếm hoặc nhấp trực tiếp lên bản đồ để chọn địa chỉ
      </p>
    </div>
  );
}
