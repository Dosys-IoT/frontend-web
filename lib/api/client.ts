import { clearSession, getToken } from "@/lib/auth/session";
import type { ApiError } from "./types";

export const REST_API_BASE_URL =
  process.env.NEXT_PUBLIC_REST_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://dosys-backend-149855215912.us-central1.run.app";

export const EDGE_API_BASE_URL =
  process.env.NEXT_PUBLIC_EDGE_API_BASE_URL ??
  "https://dosys-edge-149855215912.us-central1.run.app";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  baseUrl?: string;
  timeoutMs?: number;
}

export async function apiFetch<T>(
  path: string,
  {
    body,
    auth = true,
    headers,
    baseUrl = REST_API_BASE_URL,
    timeoutMs = 12_000,
    ...rest
  }: RequestOptions = {}
): Promise<T> {
  const h = new Headers(headers);
  h.set("Accept", "application/json");
  if (body !== undefined) h.set("Content-Type", "application/json");
  if (auth) {
    const token = getToken();
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(new URL(path, baseUrl), {
      ...rest,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const err: ApiError = {
      status: 0,
      message:
        error instanceof DOMException && error.name === "AbortError"
          ? `Request timed out after ${Math.round(timeoutMs / 1000)}s`
          : "Network request failed",
      body: error,
    };
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (auth && res.status === 401) {
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

  if (res.status === 204) return null as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}
