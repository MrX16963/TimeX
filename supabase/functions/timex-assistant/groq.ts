export const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_MODEL = "llama-3.3-70b-versatile";

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function requestGroq(
  apiKey: string,
  messages: GroqMessage[],
): Promise<Response> {
  return fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
      stream: false,
    }),
  });
}

export async function describeGroqError(response: Response): Promise<string> {
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("text/html") || /^\s*<html\b/i.test(body)) {
    return "Groq returned an HTML access-denied page instead of an API error.";
  }

  let detail = "";
  try {
    const parsed = JSON.parse(body) as { error?: { message?: unknown; code?: unknown } };
    if (typeof parsed.error?.message === "string") detail = parsed.error.message;
    if (typeof parsed.error?.code === "string" || typeof parsed.error?.code === "number") {
      detail = `${detail}${detail ? " " : ""}(code ${parsed.error.code})`;
    }
  } catch {
    detail = body;
  }
  return detail.replace(/[\r\n\t]+/g, " ").slice(0, 240) || `HTTP ${response.status}`;
}
