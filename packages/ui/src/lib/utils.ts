import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** UUID that works on older Android WebViews (Sunmi) that lack crypto.randomUUID() */
export function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export type InterfaceType = "backoffice" | "pos" | "terminal" | "kitchen" | "display";

export function detectInterfaceType(): InterfaceType {
  if (typeof window === "undefined") return "backoffice";
  const path = window.location.pathname;
  if (path.startsWith("/pos")) return "pos";
  if (path.startsWith("/terminal")) return "terminal";
  if (path.startsWith("/kitchen")) return "kitchen";
  if (
    path.startsWith("/customer-display") ||
    path.startsWith("/customer-call")
  )
    return "display";
  return "backoffice";
}

export function formatPrice(amount: number, symbol: string): string {
  return `${amount.toFixed(2)} ${symbol}`;
}

export function parseJsonSafe<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
