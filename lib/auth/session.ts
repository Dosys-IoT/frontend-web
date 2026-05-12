"use client";

import type { UserResponse } from "@/lib/api/types";

const TOKEN_KEY = "dosys.token";
const EXPIRES_KEY = "dosys.expiresAt";
const USER_KEY = "dosys.user";

export interface Session {
  token: string;
  expiresAt: number;
  user: UserResponse;
}

export function saveSession(s: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, s.token);
  localStorage.setItem(EXPIRES_KEY, String(s.expiresAt));
  localStorage.setItem(USER_KEY, JSON.stringify(s.user));
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw || !expiresAt) return null;
  if (Date.now() >= expiresAt) {
    clearSession();
    return null;
  }
  try {
    return { token, expiresAt, user: JSON.parse(userRaw) as UserResponse };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return readSession()?.token ?? null;
}
