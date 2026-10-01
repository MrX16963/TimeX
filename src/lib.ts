export type Priority = {
  important: boolean;
  urgent: boolean;
};

export type Task = Priority & {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
};

export type Plan = {
  id: string;
  goal: string;
  steps: string[];
  createdAt: number;
};

export type AppData = {
  tasks: Task[];
  notes: Note[];
  plans: Plan[];
  points: number;
  theme: Theme;
  language: Language;
};

export type Theme = "light" | "midnight" | "sage" | "lavender";
export type Language = "ar" | "en";

export const DEFAULT_DATA: AppData = {
  tasks: [],
  notes: [],
  plans: [],
  points: 0,
  theme: "light",
  language: "ar",
};

export function getQuadrant({ important, urgent }: Priority): number {
  if (important && urgent) return 0;
  if (important) return 1;
  if (urgent) return 2;
  return 3;
}

export function buildPlanSteps(goal: string, language: "ar" | "en" = "en"): string[] {
  const cleanedGoal = goal.trim().replace(/[.!؟?]+$/, "");
  if (!cleanedGoal) return [];

  if (language === "ar") {
    return [
      `حدّد كيف ستعرف أنك أنجزت «${cleanedGoal}»`,
      `قسّم «${cleanedGoal}» إلى مراحل صغيرة قابلة للتحقيق`,
      "جهّز الوقت والأدوات والمعلومات التي تحتاجها",
      "ابدأ بأصغر خطوة مفيدة يمكنك تنفيذها",
      "راجع تقدّمك وعدّل خطتك عند الحاجة",
    ];
  }

  return [
    `Define what “${cleanedGoal}” will look like when it's done`,
    `Break “${cleanedGoal}” into small, achievable milestones`,
    `Gather the time, tools, and information you need`,
    `Start with the smallest useful next step`,
    `Review your progress and adjust the plan`,
  ];
}

export function readAppData(raw: string | null): AppData {
  if (!raw) return DEFAULT_DATA;
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.filter(isTask) : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes.filter(isNote) : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans.filter(isPlan) : [],
      points:
        typeof parsed.points === "number" && Number.isFinite(parsed.points)
          ? Math.max(0, parsed.points)
          : 0,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_DATA.theme,
      language: parsed.language === "en" ? "en" : "ar",
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<Task>;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.important === "boolean" &&
    typeof task.urgent === "boolean" &&
    typeof task.completed === "boolean" &&
    typeof task.createdAt === "number" &&
    Number.isFinite(task.createdAt)
  );
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<Note>;
  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.body === "string" &&
    typeof note.updatedAt === "number" &&
    Number.isFinite(note.updatedAt)
  );
}

function isPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<Plan>;
  return (
    typeof plan.id === "string" &&
    typeof plan.goal === "string" &&
    Array.isArray(plan.steps) &&
    plan.steps.every((step) => typeof step === "string") &&
    typeof plan.createdAt === "number" &&
    Number.isFinite(plan.createdAt)
  );
}

function isTheme(value: unknown): value is Theme {
  return (
    value === "light" ||
    value === "midnight" ||
    value === "sage" ||
    value === "lavender"
  );
}
