import { clearSession, getToken } from "@/lib/auth/session";
import type { ApiError } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://dosys-backend-149855215912.us-central1.run.app";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  { body, auth = true, headers, ...rest }: RequestOptions = {}
): Promise<T> {
  const h = new Headers(headers);
  h.set("Accept", "application/json");
  if (body !== undefined) h.set("Content-Type", "application/json");
  if (auth) {
    const token = getToken();
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401) {
    clearSession();
  }

  if (!res.ok) {
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      parsed = await res.text().catch(() => undefined);
    }
    const err: ApiError = {
      status: res.status,
      message:
        (typeof parsed === "object" && parsed && "message" in parsed
          ? String((parsed as { message: unknown }).message)
          : undefined) ?? res.statusText ?? "Request failed",
      body: parsed,
    };
    throw err;
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
