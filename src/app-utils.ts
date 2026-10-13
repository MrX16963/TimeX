import type { User } from "@supabase/supabase-js";
import { DEFAULT_DATA, readAppData, type AppData, type Language } from "./lib";

export function makeId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getContrastTextColor(hex: string): string {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const luminance = channels
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#08090b" : "#ffffff";
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftDate(dateKey: string, amount: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + amount);
  return getLocalDateKey(date);
}

export function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function loadData(): AppData {
  return loadDataForKey("timex-data");
}

export function loadDataForKey(key: string): AppData {
  try {
    return readAppData(window.localStorage.getItem(key));
  } catch {
    return DEFAULT_DATA;
  }
}

export function accountStorageKey(userId: string | undefined): string {
  return userId ? `timex-data:${userId}` : "timex-data";
}

export function chatStorageKey(userId: string | undefined): string {
  return userId ? `timex-chat:${userId}` : "timex-chat";
}

export function getDisplayName(user: User | null): string {
  if (!user) return "";
  const name = user.user_metadata?.display_name || user.user_metadata?.full_name;
  return typeof name === "string" && name.trim()
    ? name.trim().split(/\s+/)[0]
    : user.email?.split("@")[0] || "";
}

export function detectMessageLanguage(message: string, fallback: Language): Language {
  const trimmed = message.trim();
  if (!trimmed) return fallback;
  const arabicCount = (trimmed.match(/[\u0600-\u06FF]/g) ?? []).length;
  const latinCount = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  if (arabicCount === latinCount) return fallback;
  return arabicCount > latinCount ? "ar" : "en";
}
