export type GeminiContent = {
  role: "user" | "model";
  parts: Array<Record<string, unknown>>;
};

export const assistantFunctions = [
  {
    functionDeclarations: [
      {
        name: "save_note",
        description: "Save a note in this signed-in user's private TimeX workspace.",
        parameters: {
          type: "OBJECT",
          properties: { title: { type: "STRING" }, body: { type: "STRING" } },
          required: ["title", "body"],
        },
      },
      {
        name: "create_task",
        description: "Add one clearly requested task to the user's TimeX task list.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            important: { type: "BOOLEAN" },
            urgent: { type: "BOOLEAN" },
          },
          required: ["title", "important", "urgent"],
        },
      },
      {
        name: "create_plan",
        description: "Create an actionable plan with small, sequenced steps for TimeX.",
        parameters: {
          type: "OBJECT",
          properties: {
            goal: { type: "STRING" },
            steps: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["goal", "steps"],
        },
      },
    ],
  },
];

export function fetchGemini(
  apiKey: string,
  model: string,
  systemInstruction: string,
  contents: GeminiContent[],
  tools?: Array<Record<string, unknown>>,
): Promise<Response> {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        ...(tools ? { tools } : {}),
        generationConfig: { temperature: 0.5, maxOutputTokens: 1200 },
      }),
    },
  );
}

export function needsWebSearch(message: string): boolean {
  return /ابحث|بحث|دور على|دوّر على|على الانترنت|على الإنترنت|مصادر|مصدر|رابط|آخر الأخبار|اخر الاخبار|السعر الحالي|حاليًا|حالياً|google|search|look up|find sources|current|latest|news|weather|price today|source|sources/i.test(
    message,
  );
}

export function extractWebSources(candidate: unknown): Array<{ title: string; url: string }> {
  if (!candidate || typeof candidate !== "object") return [];
  const metadata = (candidate as { groundingMetadata?: unknown }).groundingMetadata;
  if (!metadata || typeof metadata !== "object") return [];
  const chunks = (metadata as { groundingChunks?: unknown }).groundingChunks;
  if (!Array.isArray(chunks)) return [];

  const sources = new Map<string, { title: string; url: string }>();
  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== "object") continue;
    const web = (chunk as { web?: unknown }).web;
    if (!web || typeof web !== "object") continue;
    const { uri, title } = web as { uri?: unknown; title?: unknown };
    if (typeof uri !== "string" || typeof title !== "string" || !title.trim()) continue;
    try {
      const url = new URL(uri);
      if (url.protocol !== "https:") continue;
      if (!sources.has(url.href)) {
        sources.set(url.href, { title: title.slice(0, 200), url: url.href });
      }
    } catch {
      continue;
    }
  }
  return [...sources.values()].slice(0, 5);
}
