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
    expect(response.reply).toContain("وأضفت خطواتها إلى مهامك");
    expect(response.actions[0]?.type).toBe("plan");
  });

  it("turns a stated goal into a plan even without the word plan", () => {
    const response = respondAsMrX("أريد أن أتعلم البرمجة", "ar", { tasks: [] });

    expect(response.actions).toMatchObject([{ type: "plan", goal: "أتعلم البرمجة" }]);
  });

  it("adds an explicitly requested task", () => {
    const response = respondAsMrX("أضف مهمة مراجعة الدرس", "ar", { tasks: [] });

    expect(response.actions).toEqual([{ type: "task", title: "مراجعة الدرس" }]);
  });

  it("applies urgency and importance when the user includes them in a task request", () => {
    const response = respondAsMrX("أضف مهمة مهمة وعاجلة: إرسال التقرير", "ar", { tasks: [] });

    expect(response.actions).toEqual([
      { type: "task", title: "إرسال التقرير", important: true, urgent: true },
    ]);
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

  it("uses scheduled deadlines as well as Eisenhower priority for recommendations", () => {
    const response = respondAsMrX("What should I do first?", "en", {
      tasks: [
        { ...openTask, id: "important", title: "Plan next month", urgent: false },
        { ...openTask, id: "due", title: "Submit application", important: false, urgent: false, scheduledDate: "2026-10-01" },
      ],
    });

    expect(response.reply).toContain("Submit application");
    expect(response.reply).toContain("overdue");
  });

  it("offers a small, prioritized first step when the user feels overwhelmed", () => {
    const response = respondAsMrX("I feel overwhelmed", "en", {
      tasks: [openTask, { ...openTask, id: "later", title: "Organize files", important: false, urgent: false }],
    });

    expect(response.reply).toContain("10 minutes");
    expect(response.reply).toContain("Prepare report");
    expect(response.reply).toContain("Leave “Organize files” for later.");
  });

  it("offers useful examples in its no-download local mode", () => {
    expect(respondAsMrX("hello", "en", { tasks: [] }).reply).toContain("no model download");
  });
});
