import { describe, expect, it } from "vitest";
import { extractWebSources, needsWebSearch } from "./gemini.ts";

describe("grounded MrX web search", () => {
  it("detects explicit Arabic and English requests for sourced information", () => {
    expect(needsWebSearch("ابحث لي عن مصادر حول إدارة الوقت")).toBe(true);
    expect(needsWebSearch("Find the latest research about sleep")).toBe(true);
    expect(needsWebSearch("Help me break my goal into steps")).toBe(false);
  });

  it("returns unique HTTPS sources and rejects unsafe or malformed links", () => {
    const candidate = {
      groundingMetadata: {
        groundingChunks: [
          { web: { title: "Time management", uri: "https://example.com/time" } },
          { web: { title: "Duplicate", uri: "https://example.com/time" } },
          { web: { title: "Unsafe", uri: "javascript:alert(1)" } },
          { web: { title: "Broken", uri: "not a URL" } },
          { web: { uri: "https://example.com/no-title" } },
        ],
      },
    };

    expect(extractWebSources(candidate)).toEqual([
      { title: "Time management", url: "https://example.com/time" },
    ]);
  });
});
