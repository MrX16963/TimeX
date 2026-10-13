import type { Language } from "./lib";

export type LookupResult = {
  title: string;
  summary: string;
  url: string;
};

type Fetcher = (
  input: string,
  init?: { signal?: AbortSignal }
) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

const FILLER =
  /^(?:(?:ابحث|بحث|دور|دوّر|دوري)\s+(?:لي\s+)?(?:عن|على|في)?|(?:شو|ما|ماذا|من|متى|أين|اين|كيف|لماذا|ليش|هل)\s+(?:هو|هي|هم|يكون|تكون|معنى|هو ال)?|ما\s+هو|ما\s+هي|اشرح\s+(?:لي)?|عرّف|عرف|tell me about|what is|what are|who is|who was|search for|look up|explain|define|how does|how do)\s*/iu;

export function extractTopic(message: string): string {
  let topic = message.trim().replace(/[؟?!.]+$/u, "");
  for (let i = 0; i < 2; i += 1) {
    const next = topic.replace(FILLER, "").trim();
    if (next === topic) break;
    topic = next;
  }
  return topic
    .replace(/^(?:ال)?(?:موضوع|مفهوم)\s+/u, "")
    .slice(0, 120)
    .trim();
}

export function isInformationQuestion(message: string): boolean {
  const text = message.trim();
  if (text.length < 4 || text.length > 200) return false;
  return /^(ابحث|بحث|دور|دوّر|ما\s|ماذا|من\s|متى|أين|اين|كم\s|شو\s|مين|what|who|when|where|how many|tell me about|search|look up)/iu.test(
    text
  );
}

async function lookupOn(
  lang: "ar" | "en",
  topic: string,
  doFetch: Fetcher,
  signal: AbortSignal
): Promise<LookupResult | null> {
  const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(topic)}`;
  const searchResponse = await doFetch(searchUrl, { signal });
  if (!searchResponse.ok) return null;
  const searchData = (await searchResponse.json()) as {
    query?: { search?: Array<{ title?: string }> };
  };
  const title = searchData.query?.search?.[0]?.title;
  if (!title) return null;
  const summaryResponse = await doFetch(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { signal }
  );
  if (!summaryResponse.ok) return null;
  const data = (await summaryResponse.json()) as {
    title?: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  };
  const summary = data.extract?.trim();
  const url = data.content_urls?.desktop?.page;
  if (!summary || !url?.startsWith("https://")) return null;
  return { title: data.title ?? title, summary: summary.slice(0, 700), url };
}

export async function lookupWeb(
  message: string,
  language: Language,
  doFetch: Fetcher = (input, init) => fetch(input, init)
): Promise<LookupResult | null> {
  const topic = extractTopic(message);
  if (!topic) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const order: Array<"ar" | "en"> = language === "ar" ? ["ar", "en"] : ["en", "ar"];
    for (const lang of order) {
      const result = await lookupOn(lang, topic, doFetch, controller.signal);
      if (result) return result;
    }
    return null;
  } catch (error) {
    console.error("TimeX web lookup failed.", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
