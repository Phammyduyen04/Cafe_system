const STEPS = ["Thông tin", "Vận chuyển", "Thanh toán"];

export interface StepIndicatorProps {
  current: number;
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-0">
          <button
            className="font-body"
            style={{
              fontSize: 11,
              fontWeight: i === current ? 600 : 400,
              color: i === current ? "#30261c" : "rgba(48,38,28,0.4)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "none",
              border: "none",
              cursor: i < current ? "pointer" : "default",
              padding: "4px 0",
            }}
          >
            {s}
          </button>
          {i < STEPS.length - 1 && (
            <span style={{ color: "rgba(48,38,28,0.25)", margin: "0 12px", fontSize: 11 }}>›</span>
          )}
        </div>
      ))}
    </div>
  );
}

export { STEPS };
