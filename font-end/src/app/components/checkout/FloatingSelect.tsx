import { useState } from "react";

export interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}

export default function FloatingSelect({
  label,
  value,
  onChange,
  options,
}: FloatingSelectProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="font-body w-full border bg-white outline-none appearance-none px-4 pt-5 pb-2 transition-colors"
        style={{
          fontSize: 13,
          borderRadius: 0,
          color: value ? "#30261c" : "transparent",
          borderColor: focused ? "#30261c" : "#d9d9d9",
          height: 52,
        }}
      >
        <option value=""></option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
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
      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(48,38,28,0.4)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
