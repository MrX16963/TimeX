import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeOpenRouterError,
  OPENROUTER_CHAT_COMPLETIONS_URL,
  OPENROUTER_MODEL,
  requestOpenRouter,
  TIMEX_SITE_URL,
} from "./openrouter";

describe("OpenRouter conversation request", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the OpenRouter endpoint, required headers, and free model", async () => {
    const fetchStub = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchStub);
    const secret = "server-only-test-key";

    await requestOpenRouter(secret, [
      { role: "system", content: "You are MrX." },
      { role: "user", content: "Hello" },
    ]);

    const [url, init] = fetchStub.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init.headers).toEqual({
      Authorization: `Bearer ${secret}`,
      "HTTP-Referer": "https://mrx16963.github.io/TimeX",
      "X-Title": "TimeX",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body)).model).toBe("deepseek/deepseek-r1:free");
    expect(String(init.body)).not.toContain(secret);
    expect(OPENROUTER_CHAT_COMPLETIONS_URL).toBe(url);
    expect(OPENROUTER_MODEL).toBe("deepseek/deepseek-r1:free");
    expect(TIMEX_SITE_URL).toBe("https://mrx16963.github.io/TimeX");
  });

  it("extracts provider rejection details without exposing request headers", async () => {
    const response = new Response(
      JSON.stringify({ error: { message: "No endpoints found for this model", code: 403 } }),
      { status: 403 },
    );
    await expect(describeOpenRouterError(response)).resolves.toBe(
      "No endpoints found for this model (code 403)",
    );
  });
});
