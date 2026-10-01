import type {
  InitProgressReport,
  MLCEngineInterface,
} from "@mlc-ai/web-llm";
import type { ChatMessage } from "./cloud";
import type { Language, Task } from "./lib";

export const MRX_MODEL_ID = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
export const MRX_MODEL_SIZE_MB = 278;

export type ModelProgress = Pick<InitProgressReport, "progress" | "text">;

let enginePromise: Promise<MLCEngineInterface> | null = null;
let modelWorker: Worker | null = null;

export function isLocalAiSupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function initializeLocalAi(
  onProgress: (progress: ModelProgress) => void,
): Promise<MLCEngineInterface> {
  if (!isLocalAiSupported()) {
    return Promise.reject(new Error("WebGPU is not available in this browser."));
  }
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
    const worker = new Worker(new URL("./mrx.worker.ts", import.meta.url), {
      type: "module",
    });
    modelWorker = worker;
    try {
      return await CreateWebWorkerMLCEngine(worker, MRX_MODEL_ID, {
        initProgressCallback: ({ progress, text }) => onProgress({ progress, text }),
      });
    } catch (error) {
      worker.terminate();
      modelWorker = null;
      throw error;
    }
  })().catch((error: unknown) => {
    enginePromise = null;
    throw error;
  });
  return enginePromise;
}

export function resetLocalAi(): void {
  modelWorker?.terminate();
  modelWorker = null;
  enginePromise = null;
}

export async function generateLocalAiReply(
  messages: ChatMessage[],
  language: Language,
  tasks: Task[],
  onProgress: (progress: ModelProgress) => void,
): Promise<string> {
  const engine = await initializeLocalAi(onProgress);
  const activeTasks = tasks.filter((task) => !task.completed);
  const taskContext = activeTasks.length
    ? activeTasks
        .slice(0, 15)
        .map((task) => `- ${task.title.slice(0, 80)}${task.important && task.urgent ? " (important and urgent)" : task.important ? " (important)" : task.urgent ? " (urgent)" : ""}`)
        .join("\n")
    : language === "ar" ? "لا توجد مهام مفتوحة حاليًا." : "There are no active tasks.";

  const systemMessage = language === "ar"
    ? [
        "اسمك MrX. أنت مساعد عربي ودود وعملي لإدارة الوقت والتخطيط الشخصي.",
        "تحدث بالعربية الواضحة والمختصرة، واجب بلغة المستخدم إذا كتب بلغة أخرى.",
        "ساعد في تقسيم الأهداف إلى خطوات واقعية، ترتيب الأولويات، التركيز، وبناء العادات. اسأل سؤالًا توضيحيًا واحدًا عند الحاجة.",
        "لا تدّعِ أنك حفظت ملاحظة أو أضفت مهمة؛ التطبيق يتعامل مع هذه الإجراءات منفصلًا.",
        "المهام النشطة للمستخدم (بيانات محلية خاصة):\n" + taskContext,
      ].join("\n")
    : [
        "Your name is MrX. You are a friendly, practical time-management and personal-planning companion.",
        "Be concise and conversational. Reply in the user's language.",
        "Help break goals into realistic steps, prioritize work, focus, and build habits. Ask one clarifying question when useful.",
        "Do not claim that you saved a note or added a task; the app handles those actions separately.",
        "The user's active tasks (private local data):\n" + taskContext,
      ].join("\n");

  const response = await engine.chat.completions.create({
    model: MRX_MODEL_ID,
    messages: [
      { role: "system", content: systemMessage },
      ...messages.slice(-8).map(({ role, content }) => ({ role, content: content.slice(-600) })),
    ],
    temperature: 0.6,
    max_tokens: 240,
  });
  const reply = response.choices[0]?.message.content;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("The on-device language model returned an empty response.");
  }
  return reply.trim();
}
