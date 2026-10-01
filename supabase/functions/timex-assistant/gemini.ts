export type GeminiContent = {
  role: "user" | "model";
  parts: Array<Record<string, unknown>>;
};

export const assistantFunctions = [
  {
    functionDeclarations: [
      {
        name: "save_note",
        description: "Save a note in this signed-in user's private TimeX workspace.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            body: { type: "STRING" },
          },
          required: ["title", "body"],
        },
      },
      {
        name: "create_plan",
        description: "Build and save an actionable plan in this signed-in user's TimeX workspace.",
        parameters: {
          type: "OBJECT",
          properties: {
            goal: { type: "STRING" },
            steps: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
          },
          required: ["goal", "steps"],
        },
      },
    ],
  },
];

export function fetchGemini(
  apiKey: string,
  model: string,
  systemInstruction: string,
  contents: GeminiContent[],
  tools?: Array<Record<string, unknown>>,
): Promise<Response> {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        ...(tools ? { tools } : {}),
        generationConfig: { temperature: 0.5, maxOutputTokens: 1000 },
      }),
    },
  );
}
