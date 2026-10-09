import { afterEach, describe, expect, it, vi } from "vitest";
import { extractWebSources, fetchGemini, needsWebSearch } from "./gemini";

describe("Gemini Google Search integration", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("recognizes explicit English and Arabic web-search requests", () => {
    expect(needsWebSearch("Search Google for current study techniques")).toBe(true);
    expect(needsWebSearch("ابحث في غوغل عن مصادر موثوقة")).toBe(true);
    expect(needsWebSearch("Help me plan a study schedule")).toBe(false);
  });

  it("extracts unique HTTPS grounding sources and rejects unsafe or malformed links", () => {
    const candidate = {
      groundingMetadata: {
        groundingChunks: [
          { web: { title: "Research", uri: "https://example.com/guide" } },
          { web: { title: "Duplicate", uri: "https://example.com/guide" } },
          { web: { title: "Unsafe", uri: "http://example.com" } },
          { web: { title: "Malformed", uri: "not a url" } },
          { web: { title: "", uri: "https://example.com/empty" } },
        ],
      },
    };

    expect(extractWebSources(candidate)).toEqual([
      { title: "Research", url: "https://example.com/guide" },
    ]);
    expect(extractWebSources(null)).toEqual([]);
  });

  it("keeps the Gemini API key in the server-side header only", async () => {
    const fetchStub = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchStub);
    const apiKey = "server-only-test-key";

    await fetchGemini(
      apiKey,
      "gemini-2.5-flash",
      "You are MrX.",
      [{ role: "user", parts: [{ text: "Find sources" }] }],
      [{ google_search: {} }],
    );

    const [url, init] = fetchStub.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain(apiKey);
    expect(init.headers).toMatchObject({ "x-goog-api-key": apiKey });
    expect(String(init.body)).not.toContain(apiKey);
    expect(JSON.parse(String(init.body)).tools).toEqual([{ google_search: {} }]);
  });
});
