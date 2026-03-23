import { useEffect, useRef, useState } from "react";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Singleton script loader
let scriptState: "idle" | "loading" | "ready" | "error" = "idle";
const onReadyCallbacks: (() => void)[] = [];

function loadGoogleMaps(onReady: () => void) {
  if (!MAPS_KEY) { onReady(); return; }
  if (scriptState === "ready") { onReady(); return; }
  onReadyCallbacks.push(onReady);
  if (scriptState === "loading") return;

  scriptState = "loading";
  (window as any).__initGooglePlaces = () => {
    scriptState = "ready";
    onReadyCallbacks.forEach(cb => cb());
    onReadyCallbacks.length = 0;
  };

  const s = document.createElement("script");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&callback=__initGooglePlaces&language=vi`;
  s.async = true;
  s.onerror = () => { scriptState = "error"; };
  document.head.appendChild(s);
}

// Khu vực TPHCM để ưu tiên gợi ý
const HCMC_BOUNDS = {
  north: 11.16,
  south: 10.40,
  east:  107.03,
  west:  106.35,
};

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

export default function AddressAutocomplete({ label = "Địa chỉ giao hàng", value, onChange, required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<any>(null);
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  useEffect(() => {
    if (!MAPS_KEY) return; // fallback: plain input

    loadGoogleMaps(() => {
      if (!inputRef.current || acRef.current) return;
      const google = (window as any).google;
      if (!google?.maps?.places) return;

      const bounds = new google.maps.LatLngBounds(
        { lat: HCMC_BOUNDS.south, lng: HCMC_BOUNDS.west },
        { lat: HCMC_BOUNDS.north, lng: HCMC_BOUNDS.east }
      );

      acRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        bounds,
        strictBounds: false,           // gợi ý TPHCM trước, nhưng không bắt buộc
        componentRestrictions: { country: "vn" },
        types: ["geocode", "establishment"],
        fields: ["formatted_address", "geometry", "name"],
      });

      acRef.current.addListener("place_changed", () => {
        const place = acRef.current.getPlace();
        const addr = place?.formatted_address || place?.name || inputRef.current?.value || "";
        onChange(addr);
      });
    });

    return () => {
      // Cleanup pac-container dropdown nếu có
      if (acRef.current) {
        (window as any).google?.maps?.event?.clearInstanceListeners(acRef.current);
        acRef.current = null;
      }
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        required={required}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={MAPS_KEY ? "off" : "street-address"}
        className="font-body w-full border bg-white outline-none transition-colors px-4 pt-5 pb-2"
        style={{
          fontSize: 13,
          borderRadius: 0,
          color: "#30261c",
          borderColor: focused ? "#30261c" : "#d9d9d9",
          height: 52,
        }}
      />
      <label
        className="font-body"
        style={{
          position: "absolute",
          left: 16,
          top: active ? 7 : "50%",
          transform: active ? "none" : "translateY(-50%)",
          fontSize: active ? 10 : 13,
          color: focused ? "#30261c" : "rgba(48,38,28,0.45)",
          transition: "all 0.15s ease",
          pointerEvents: "none",
          letterSpacing: active ? "1px" : "0",
          textTransform: active ? "uppercase" : "none",
        }}
      >
        {label}
      </label>
    </div>
  );
}
