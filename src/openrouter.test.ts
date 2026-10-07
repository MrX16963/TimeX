import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assistantTools,
  extractWebSources,
  fetchOpenRouter,
  needsWebSearch,
} from "../supabase/functions/timex-assistant/openrouter";

describe("OpenRouter assistant provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends credentials server-side with the configured model and signed-in conversation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const messages = [
      { role: "system" as const, content: "Respond in Arabic." },
      { role: "user" as const, content: "Help me make a plan" },
    ];

    await fetchOpenRouter("server-only-key", "openrouter/auto", messages, assistantTools);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(request.headers).toMatchObject({
      Authorization: "Bearer server-only-key",
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mrx16963.github.io/TimeX/",
      "X-Title": "TimeX",
    });
    expect(JSON.parse(request.body)).toMatchObject({
      model: "openrouter/auto",
      messages,
      tools: assistantTools,
      tool_choice: "auto",
      temperature: 0.5,
      max_tokens: 1000,
    });
  });

  it("enables the web plugin only for explicitly requested research", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchOpenRouter("server-only-key", "openrouter/auto", [], undefined, true);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      plugins: [{ id: "web" }],
    });
  });

  it("defines task, note, and plan tools", () => {
    expect(assistantTools.map((tool) => tool.function.name)).toEqual([
      "save_note",
      "create_task",
      "create_plan",
    ]);
  });

  it("detects web-search requests and keeps only safe HTTPS citations", () => {
    expect(needsWebSearch("ابحث عن آخر الأخبار")).toBe(true);
    expect(needsWebSearch("Help me create a study plan")).toBe(false);
    expect(extractWebSources({
      annotations: [
        { type: "url_citation", url_citation: { url: "https://example.com", title: "Example" } },
        { type: "url_citation", url_citation: { url: "javascript:alert(1)", title: "Unsafe" } },
      ],
    })).toEqual([{ title: "Example", url: "https://example.com/" }]);
  });
});
