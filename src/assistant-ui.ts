import type { ChatMode } from "./assistant-conversations";
import type { Language } from "./lib";

export type AssistantModeId = "groq" | "mrx_search" | "mrx_planner" | "chat";

export const ASSISTANT_MODES: Array<{ id: AssistantModeId; icon: string }> = [
  { id: "groq", icon: "⚡" },
  { id: "mrx_search", icon: "🔎" },
  { id: "mrx_planner", icon: "🗓" },
  { id: "chat", icon: "✳" },
];

export const CONNECTED_MODES: ChatMode[] = ["groq", "mrx_search", "mrx_planner"];

export function isConnectedMode(mode: ChatMode): boolean {
  return CONNECTED_MODES.includes(mode);
}

export const CHAT_STARTERS: Record<Language, Record<AssistantModeId, string[]>> = {
  ar: {
    groq: ["أعطني نصيحة سريعة للتركيز اليوم", "ساعدني في كتابة رسالة تذكير مهذبة", "اشرح مصفوفة أيزنهاور في سطرين"],
    mrx_search: ["ما هي تقنية بومودورو؟", "ابحث عن أفضل طريقة لبناء عادة المذاكرة", "ما هو تقسيم الوقت؟"],
    mrx_planner: ["خطط لي أسبوع مذاكرة للامتحان", "صمم جدول عمل عميق لمدة 3 ساعات غدًا", "حوّل مهامي المفتوحة إلى خطة يومية"],
    chat: ["أضف مهمة: الاتصال بالبنك", "اعمل خطة لتعلم لغة جديدة", "ماذا أفعل أولًا اليوم؟"],
  },
  en: {
    groq: ["Give me a quick tip to focus today", "Help me write a polite reminder message", "Explain the Eisenhower matrix in two lines"],
    mrx_search: ["What is the Pomodoro technique?", "Research the best way to build a study habit", "What is time blocking?"],
    mrx_planner: ["Plan my week of study for an exam", "Build a 3-hour deep-work schedule for tomorrow", "Turn my open tasks into a daily plan"],
    chat: ["Add a task: call the bank", "Make a plan to learn a new language", "What should I do first today?"],
  },
};

export function modeIdOf(mode: ChatMode): AssistantModeId {
  return mode === "groq" || mode === "mrx_search" || mode === "mrx_planner" ? mode : "chat";
}

export function formatConversationTime(iso: string, language: Language, now = Date.now()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  const date = new Date(time);
  const sameDay = new Date(now).toDateString() === date.toDateString();
  return new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", sameDay
    ? { hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric" }).format(date);
}
