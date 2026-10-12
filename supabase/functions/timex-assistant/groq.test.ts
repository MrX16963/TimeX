import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeGroqError,
  GROQ_CHAT_COMPLETIONS_URL,
  GROQ_MODEL,
  requestGroq,
} from "./groq";

describe("Groq conversation request", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the configured model and secret only in the authorization header", async () => {
    const fetchStub = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchStub);
    const secret = "server-only-groq-key";
    await requestGroq(secret, [
      { role: "system", content: "You are MrX." },
      { role: "user", content: "Hello" },
    ]);

    const [url, init] = fetchStub.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers).toEqual({
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are MrX." },
        { role: "user", content: "Hello" },
      ],
      temperature: 0.7,
    });
    expect(String(init.body)).not.toContain(secret);
    expect(GROQ_CHAT_COMPLETIONS_URL).toBe(url);
    expect(GROQ_MODEL).toBe("llama-3.1-8b-instant");
  });

  it("returns JSON provider details and recognizes HTML blocks", async () => {
    await expect(
      describeGroqError(
        new Response(JSON.stringify({ error: { message: "Invalid API key", code: "bad_key" } }), {
          status: 401,
        }),
      ),
    ).resolves.toBe("Invalid API key (code bad_key)");

    await expect(
      describeGroqError(
        new Response("<html>Forbidden</html>", {
          status: 403,
          headers: { "content-type": "text/html" },
        }),
      ),
    ).resolves.toContain("HTML access-denied page");
  });
});
