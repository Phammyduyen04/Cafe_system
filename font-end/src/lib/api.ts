const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {}

    // Chỉ auto-logout khi 401 từ API có token (không phải login/register)
    if (res.status === 401 && token) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:logout"));
    }

    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const json = await res.json();

  // Unwrap backend { success, data, message, pagination? } envelope
  if (json && typeof json === "object" && "success" in json && "data" in json) {
    if ("pagination" in json) {
      return { data: json.data, pagination: json.pagination } as T;
    }
    return json.data as T;
  }

  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
