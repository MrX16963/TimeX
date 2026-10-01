import { describe, expect, it } from "vitest";
import { respondAsMrX } from "./mrx-assistant";
import type { Task } from "./lib";

const openTask: Task = {
  id: "report",
  title: "Prepare report",
  important: true,
  urgent: true,
  completed: false,
  createdAt: 1,
};

describe("MrX local planning assistant", () => {
  it("creates actionable plan steps in Arabic without an external provider", () => {
    const response = respondAsMrX("أنشئ لي خطة لتعلم البرمجة", "ar", { tasks: [] });

    expect(response.actions).toMatchObject([
      { type: "plan", goal: "تعلم البرمجة", steps: expect.arrayContaining([expect.any(String)]) },
    ]);
    expect(response.reply).toContain("خطة أولية");
  });

  it("turns a stated goal into a plan even without the word plan", () => {
    const response = respondAsMrX("أريد أن أتعلم البرمجة", "ar", { tasks: [] });

    expect(response.actions).toMatchObject([{ type: "plan", goal: "أتعلم البرمجة" }]);
  });

  it("adds an explicitly requested task", () => {
    const response = respondAsMrX("أضف مهمة مراجعة الدرس", "ar", { tasks: [] });

    expect(response.actions).toEqual([{ type: "task", title: "مراجعة الدرس" }]);
  });

  it("saves a requested note locally", () => {
    const response = respondAsMrX("احفظ ملاحظة: اتصال بالطبيب", "ar", { tasks: [] });

    expect(response.actions).toEqual([
      { type: "note", title: "اتصال بالطبيب", body: "اتصال بالطبيب" },
    ]);
  });

  it("suggests the most urgent important open task", () => {
    const response = respondAsMrX("ما أولوياتي اليوم؟", "ar", {
      tasks: [
        { ...openTask, id: "later", title: "Organize files", important: true, urgent: false },
        openTask,
      ],
    });

    expect(response.reply).toContain("Prepare report");
    expect(response.reply).toContain("مهمة وعاجلة");
  });

  it("explains its no-key local mode in English", () => {
    expect(respondAsMrX("hello", "en", { tasks: [] }).reply).toContain("without a subscription or API key");
  });
});
