import { afterEach, describe, expect, it, vi } from "vitest";
import { assistantFunctions, fetchGemini } from "../supabase/functions/timex-assistant/gemini";

describe("Gemini assistant provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends private credentials in the API header with the signed-in conversation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchGemini(
      "server-only-key",
      "gemini-2.5-flash",
      "Respond in Arabic.",
      [{ role: "user", parts: [{ text: "Help me make a plan" }] }],
      assistantFunctions,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    );
    expect(request.headers).toMatchObject({
      "x-goog-api-key": "server-only-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(request.body)).toMatchObject({
      systemInstruction: { parts: [{ text: "Respond in Arabic." }] },
      contents: [{ role: "user", parts: [{ text: "Help me make a plan" }] }],
      tools: assistantFunctions,
      generationConfig: { temperature: 0.5, maxOutputTokens: 1000 },
    });
  });

  it("defines only the validated note and plan actions", () => {
    expect(assistantFunctions[0].functionDeclarations.map(({ name }) => name)).toEqual([
      "save_note",
      "create_plan",
    ]);
    expect(assistantFunctions[0].functionDeclarations[0].parameters.required).toEqual([
      "title",
      "body",
    ]);
    expect(assistantFunctions[0].functionDeclarations[1].parameters.required).toEqual([
      "goal",
      "steps",
    ]);
  });
});
