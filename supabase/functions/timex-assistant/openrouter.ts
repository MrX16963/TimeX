export const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_MODEL = "deepseek/deepseek-r1:free";
export const TIMEX_SITE_URL = "https://mrx16963.github.io/TimeX";

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function requestOpenRouter(
  apiKey: string,
  messages: OpenRouterMessage[],
): Promise<Response> {
  return fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": TIMEX_SITE_URL,
      "X-Title": "TimeX",
      "User-Agent": "TimeX/1.0 (+https://mrx16963.github.io/TimeX)",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
      stream: false,
    }),
  });
}

export async function describeOpenRouterError(response: Response): Promise<string> {
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const isHtml =
    contentType.toLowerCase().includes("text/html") ||
    /^\s*(?:<!doctype\s+html|<html\b)/i.test(body);
  if (isHtml) {
    const rayId = response.headers.get("cf-ray");
    return rayId
      ? `Cloudflare blocked the request before OpenRouter processed it (Ray ID: ${rayId}).`
      : "Cloudflare returned an HTML block page before OpenRouter processed the request.";
  }

  let detail = "";
  try {
    const parsed = JSON.parse(body) as { error?: { message?: unknown; code?: unknown } };
    const message = parsed.error?.message;
    const code = parsed.error?.code;
    if (typeof message === "string") detail = message;
    if (typeof code === "string" || typeof code === "number") {
      detail = `${detail}${detail ? " " : ""}(code ${code})`;
    }
  } catch {
    detail = body;
  }
  detail = detail.replace(/[\r\n\t]+/g, " ").slice(0, 240);
  return detail || `HTTP ${response.status}`;
}
