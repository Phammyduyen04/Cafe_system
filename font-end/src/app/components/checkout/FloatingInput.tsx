import { useState } from "react";

export interface FloatingInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

export default function FloatingInput({
  label,
  type = "text",
  value,
  onChange,
  required,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative w-full">
      <input
        type={type}
        value={value}
        required={required}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
