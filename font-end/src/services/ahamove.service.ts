const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface AhamoveFeeResult {
  totalPrice: number;
  distance: number;  // metres
  duration: number;  // seconds
  source?: "ahamove" | "estimate"; // "estimate" = Haversine fallback
}

/**
 * Estimate Ahamove delivery fee via our own backend.
 * The backend holds the Ahamove API key — nothing sensitive is exposed to the browser.
 * Supports AbortSignal so callers can cancel stale requests when the address changes.
 */
export async function estimateAhamoveFee(
  destLat: number,
  destLng: number,
  destAddress: string,
  signal?: AbortSignal,
): Promise<AhamoveFeeResult> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/shipping/estimate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ destLat, destLng, destAddress }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).message ?? `Lỗi ${res.status}`);
  }

  const json = await res.json();
  // Backend trả về { success: true, data: { totalPrice, distance, duration } }
  const data = (json?.data ?? json) as AhamoveFeeResult;
  return data;
}
