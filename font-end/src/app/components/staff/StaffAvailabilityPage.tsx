import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { staffService, type Employee } from "../../../services/staff.service";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS: Record<string, string> = {
  MON: "Thứ 2", TUE: "Thứ 3", WED: "Thứ 4", THU: "Thứ 5", FRI: "Thứ 6", SAT: "Thứ 7", SUN: "CN",
};

export default function StaffAvailabilityPage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeRanges, setTimeRanges] = useState<{ start: string; end: string }[]>([]);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const emp = await staffService.getEmployeeByAccountId(user!.accountId);
      setEmployee(emp);
      const avail = await staffService.getAvailability(emp.employeeId);
      if (avail) {
        setSelectedDays(avail.availableDays || []);
        setTimeRanges(avail.availableTimeRanges || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const addTimeRange = () => {
    setTimeRanges((prev) => [...prev, { start: "08:00", end: "17:00" }]);
  };

  const removeTimeRange = (index: number) => {
    setTimeRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTimeRange = (index: number, field: "start" | "end", value: string) => {
    setTimeRanges((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const handleSave = async () => {
    if (!employee) return;
    try {
      setSaving(true);
      setError("");
      await staffService.updateAvailability(employee.employeeId, {
        availableDays: selectedDays,
        availableTimeRanges: timeRanges,
      });
      setSuccessMsg("Cập nhật lịch rảnh thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Lỗi khi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cafe-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cafe-bg)] pt-24">
      <div className="max-w-[800px] mx-auto px-6 md:px-12 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/staff/schedule" className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 13 }}>Lịch làm</Link>
          <span className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 13 }}>/</span>
          <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>Cập nhật lịch rảnh</span>
        </div>

        <h1 className="font-heading text-[var(--cafe-primary)] mb-8" style={{ fontSize: 28, fontWeight: 700 }}>
          Cập nhật lịch rảnh
        </h1>

        {successMsg && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[var(--cafe-red)] font-body text-sm">
            {error}
          </div>
        )}

        {/* Days */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[var(--cafe-border)]">
          <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 18, fontWeight: 600 }}>
            Ngày rảnh
          </h2>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className="font-body px-4 py-2.5 rounded-lg border transition-colors"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: selectedDays.includes(day) ? "var(--cafe-primary)" : "transparent",
                  color: selectedDays.includes(day) ? "#fff" : "var(--cafe-primary)",
                  borderColor: selectedDays.includes(day) ? "var(--cafe-primary)" : "var(--cafe-border)",
                }}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>

        {/* Time ranges */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[var(--cafe-border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 18, fontWeight: 600 }}>
              Khung giờ
            </h2>
            <button
              onClick={addTimeRange}
              className="font-body px-3 py-1.5 bg-[var(--cafe-accent)] text-[var(--cafe-primary)] rounded-lg hover:opacity-80"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              + Thêm khung giờ
            </button>
          </div>
          {timeRanges.length === 0 ? (
            <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>Chưa có khung giờ nào</p>
          ) : (
            <div className="space-y-3">
              {timeRanges.map((range, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="time"
                    value={range.start}
                    onChange={(e) => updateTimeRange(i, "start", e.target.value)}
                    className="font-body px-3 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
                    style={{ fontSize: 13 }}
                  />
                  <span className="font-body text-[var(--cafe-primary)]/40">—</span>
                  <input
                    type="time"
                    value={range.end}
                    onChange={(e) => updateTimeRange(i, "end", e.target.value)}
                    className="font-body px-3 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
                    style={{ fontSize: 13 }}
                  />
                  <button
                    onClick={() => removeTimeRange(i)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--cafe-red)] hover:bg-red-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-body w-full py-3 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ fontSize: 15, fontWeight: 600 }}
        >
          {saving ? "Đang lưu..." : "Lưu lịch rảnh"}
        </button>
      </div>
    </div>
  );
}
