import { describe, expect, it } from "vitest";
import { extractTopic, isInformationQuestion, lookupWeb } from "./web-lookup";

describe("web lookup", () => {
  it("extracts the topic from questions", () => {
    expect(extractTopic("what is the Pomodoro Technique?")).toBe("the Pomodoro Technique");
    expect(extractTopic("ابحث عن تقنية بومودورو")).toBe("تقنية بومودورو");
  });

  it("detects information questions only", () => {
    expect(isInformationQuestion("who is Ibn Sina")).toBe(true);
    expect(isInformationQuestion("thanks")).toBe(false);
  });

  it("returns a sourced summary from the search and summary endpoints", async () => {
    const calls: string[] = [];
    const result = await lookupWeb("what is Pomodoro", "en", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () =>
          url.includes("list=search")
            ? { query: { search: [{ title: "Pomodoro Technique" }] } }
            : {
                title: "Pomodoro Technique",
                extract: "A time management method.",
                content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Pomodoro_Technique" } },
              },
      };
    });
    expect(result?.url).toBe("https://en.wikipedia.org/wiki/Pomodoro_Technique");
    expect(calls).toHaveLength(2);
  });

  it("returns null when nothing is found", async () => {
    const result = await lookupWeb("what is zzzz", "en", async () => ({
      ok: true,
      json: async () => ({ query: { search: [] } }),
    }));
    expect(result).toBeNull();
  });
});
