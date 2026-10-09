import { describe, expect, it } from "vitest";
import { isResearchRequest, respondAsMrX } from "./mrx-assistant";
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
  it("creates actionable Arabic plans offline", async () => {
    const response = await respondAsMrX("أنشئ لي خطة لتعلم البرمجة", "ar", { tasks: [] });

    expect(response.actions).toMatchObject([
      { type: "plan", goal: "تعلم البرمجة", steps: expect.arrayContaining([expect.any(String)]) },
    ]);
    expect(response.reply).toContain("وأضفت خطواتها إلى مهامك");
    expect(response.actions[0]?.type).toBe("plan");
  });

  it("turns a stated goal into a plan even without the word plan", async () => {
    const response = await respondAsMrX("أريد أن أتعلم البرمجة", "ar", { tasks: [] });

    expect(response.actions).toMatchObject([{ type: "plan", goal: "أتعلم البرمجة" }]);
  });

  it("adds an explicitly requested task", async () => {
    const response = await respondAsMrX("أضف مهمة مراجعة الدرس", "ar", { tasks: [] });

    expect(response.actions).toEqual([{ type: "task", title: "مراجعة الدرس" }]);
  });

  it("applies urgency and importance when the user includes them in a task request", async () => {
    const response = await respondAsMrX("أضف مهمة مهمة وعاجلة: إرسال التقرير", "ar", { tasks: [] });

    expect(response.actions).toEqual([
      { type: "task", title: "إرسال التقرير", important: true, urgent: true },
    ]);
  });

  it("saves a requested note locally", async () => {
    const response = await respondAsMrX("احفظ ملاحظة: اتصال بالطبيب", "ar", { tasks: [] });

    expect(response.actions).toEqual([
      { type: "note", title: "اتصال بالطبيب", body: "اتصال بالطبيب" },
    ]);
  });

  it("suggests the most urgent important open task", async () => {
    const response = await respondAsMrX("ما أولوياتي اليوم؟", "ar", {
      tasks: [
        { ...openTask, id: "later", title: "Organize files", important: true, urgent: false },
        openTask,
      ],
    });

    expect(response.reply).toContain("Prepare report");
    expect(response.reply).toContain("مهمة وعاجلة");
  });

  it("uses scheduled deadlines as well as Eisenhower priority for recommendations", async () => {
    const response = await respondAsMrX("What should I do first?", "en", {
      tasks: [
        { ...openTask, id: "important", title: "Plan next month", urgent: false },
        { ...openTask, id: "due", title: "Submit application", important: false, urgent: false, scheduledDate: "2026-10-01" },
      ],
    });

    expect(response.reply).toContain("Submit application");
    expect(response.reply).toContain("overdue");
  });

  it("offers a small, prioritized first step when the user feels overwhelmed", async () => {
    const response = await respondAsMrX("I feel overwhelmed", "en", {
      tasks: [openTask, { ...openTask, id: "later", title: "Organize files", important: false, urgent: false }],
    });

    expect(response.reply).toContain("10 minutes");
    expect(response.reply).toContain("Prepare report");
    expect(response.reply).toContain("Leave “Organize files” for later.");
  });

  it("responds warmly to greetings and invites the next conversational turn", async () => {
    const response = await respondAsMrX("hello", "en", { tasks: [] });

    expect(response.reply).toContain("Hello");
    expect(response.reply).toContain("goal");
  });

  it("never searches the web in Plan mode and explains why advanced search is unavailable offline", async () => {
    const normalPlan = await respondAsMrX(
      "Create a plan to study programming",
      "en",
      { tasks: [] },
      "plan",
    );
    const advancedPlan = await respondAsMrX(
      "Create a plan to study programming",
      "en",
      { tasks: [], researchUnavailable: true },
      "advanced-plan",
    );

    expect(normalPlan.reply).not.toContain("Google Search");
    expect(advancedPlan.reply).toContain("Google Search isn't available");
    expect(advancedPlan.actions).toMatchObject([{ type: "plan", goal: "study programming" }]);
  });

  it("identifies English and Arabic requests for web search", () => {
    expect(isResearchRequest("Search Google for current study techniques")).toBe(true);
    expect(isResearchRequest("ابحث في غوغل عن مصادر")).toBe(true);
    expect(isResearchRequest("Help me create a plan")).toBe(false);
  });

  it("continues a conversation by explaining a step from the latest saved plan", async () => {
    const response = await respondAsMrX("Explain the second step", "en", {
      tasks: [],
      plans: [{
        id: "plan-1",
        goal: "Prepare for exams",
        steps: ["List the topics", "Schedule study sessions"],
        createdAt: 1,
      }],
    });

    expect(response.reply).toContain("Schedule study sessions");
    expect(response.reply).toContain("help choose what comes next");
  });

  it("uses recent assistant context to answer follow-up questions", async () => {
    const response = await respondAsMrX("Explain that", "en", {
      tasks: [],
      history: [{ role: "assistant", content: "Start by choosing one lesson to review." }],
    });

    expect(response.reply).toContain("choosing one lesson");
    expect(response.reply).toContain("Which part");
  });
});
