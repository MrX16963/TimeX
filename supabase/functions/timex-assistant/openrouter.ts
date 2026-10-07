export type OpenRouterMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<Record<string, unknown>>;
  tool_call_id?: string;
};

export const assistantTools = [
  {
    type: "function",
    function: {
      name: "save_note",
      description: "Save a note in this signed-in user's private TimeX workspace.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
        },
        required: ["title", "body"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Add one clearly requested task to the signed-in user's TimeX task list.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          important: { type: "boolean" },
          urgent: { type: "boolean" },
        },
        required: ["title", "important", "urgent"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_plan",
      description: "Build and save an actionable plan in this signed-in user's TimeX workspace.",
      parameters: {
        type: "object",
        properties: {
          goal: { type: "string" },
          steps: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["goal", "steps"],
        additionalProperties: false,
      },
    },
  },
];

export function fetchOpenRouter(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  tools?: Array<Record<string, unknown>>,
  webSearch = false,
): Promise<Response> {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mrx16963.github.io/TimeX/",
      "X-Title": "TimeX",
    },
    body: JSON.stringify({
      model,
      messages,
      ...(tools ? { tools, tool_choice: "auto" } : {}),
      ...(webSearch ? { plugins: [{ id: "web" }] } : {}),
      temperature: 0.5,
      max_tokens: 1000,
    }),
  });
}

export function needsWebSearch(message: string): boolean {
  return /ابحث|ابحثلي|دور على|دوّر على|على الانترنت|على الإنترنت|مصادر|مصدر|رابط|آخر الأخبار|اخر الاخبار|السعر الحالي|حاليًا|حالياً|google|search|look up|find sources|current|latest|news|weather|price today|source|sources/i.test(
    message,
  );
}

export function extractWebSources(message: unknown): Array<{ title: string; url: string }> {
  if (!message || typeof message !== "object") return [];
  const value = message as { annotations?: unknown; sources?: unknown };
  const annotations = Array.isArray(value.annotations) ? value.annotations : [];
  const providerSources = Array.isArray(value.sources) ? value.sources : [];
  const sources = new Map<string, { title: string; url: string }>();

  for (const entry of [...annotations, ...providerSources]) {
    if (!entry || typeof entry !== "object") continue;
    const annotation = entry as {
      type?: unknown;
      url_citation?: { url?: unknown; title?: unknown };
      url?: unknown;
      title?: unknown;
    };
    if (annotation.type && annotation.type !== "url_citation") continue;
    const urlValue = annotation.url_citation?.url ?? annotation.url;
    const titleValue = annotation.url_citation?.title ?? annotation.title;
    if (typeof urlValue !== "string" || typeof titleValue !== "string" || !titleValue.trim()) continue;
    try {
      const url = new URL(urlValue);
      if (url.protocol !== "https:") continue;
      if (!sources.has(url.href)) {
        sources.set(url.href, { title: titleValue.slice(0, 200), url: url.href });
      }
    } catch {
      continue;
    }
  }
  return [...sources.values()].slice(0, 5);
}
