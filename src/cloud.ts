import { createClient } from "@supabase/supabase-js";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
  sources?: Array<{ title: string; url: string }>;
};

export type AssistantAction =
  | { type: "note"; title: string; body: string }
  | {
      type: "plan";
      goal: string;
      steps: string[];
      researchSummary?: string;
      sources?: Array<{ title: string; url: string }>;
    }
  | { type: "task"; title: string; important?: boolean; urgent?: boolean };

export type AssistantResponse = {
  reply: string;
  actions: AssistantAction[];
  sources?: Array<{ title: string; url: string }>;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const cloudConfigurationMissing = !supabaseUrl || !supabaseAnonKey;
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function createLocalId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function readChatMessages(key: string): ChatMessage[] {
  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChatMessage).slice(-100);
  } catch {
    return [];
  }
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    typeof message.created_at === "string" &&
    (message.sources === undefined ||
      (Array.isArray(message.sources) &&
        message.sources.every(
          (source) =>
            source &&
            typeof source.title === "string" &&
            typeof source.url === "string" &&
            source.url.startsWith("https://"),
        )))
  );
}
