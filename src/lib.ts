export type Priority = {
  important: boolean;
  urgent: boolean;
};

export type Task = Priority & {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  reminderMinutes?: number | null;
  reminderSentAt?: number;
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
  accentColor: string;
  language: Language;
};

export type Theme = "light" | "midnight" | "sage" | "lavender" | "custom";
export type Language = "ar" | "en";

export const DEFAULT_DATA: AppData = {
  tasks: [],
  notes: [],
  plans: [],
  points: 0,
  theme: "light",
  accentColor: "#e7e7e7",
  language: "ar",
};

export function getQuadrant({ important, urgent }: Priority): number {
  if (important && urgent) return 0;
  if (important) return 1;
  if (urgent) return 2;
  return 3;
}

export type CalendarTaskLayout = {
  task: Task & Required<Pick<Task, "scheduledDate" | "startTime" | "endTime">>;
  column: number;
  columns: number;
  startMinutes: number;
  durationMinutes: number;
};

export function layoutCalendarTasks(tasks: Task[]): CalendarTaskLayout[] {
  const scheduled = tasks
    .filter(
      (task): task is Task & Required<Pick<Task, "scheduledDate" | "startTime" | "endTime">> =>
        Boolean(task.scheduledDate && task.startTime && task.endTime),
    )
    .map((task) => {
      const [startHour, startMinute] = task.startTime.split(":").map(Number);
      const [endHour, endMinute] = task.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      return {
        task,
        startMinutes,
        endMinutes: endHour * 60 + endMinute,
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

  const groups: typeof scheduled[] = [];
  let currentGroup: typeof scheduled = [];
  let groupEnd = -1;
  for (const appointment of scheduled) {
    if (currentGroup.length > 0 && appointment.startMinutes >= groupEnd) {
      groups.push(currentGroup);
      currentGroup = [];
      groupEnd = -1;
    }
    currentGroup.push(appointment);
    groupEnd = Math.max(groupEnd, appointment.endMinutes);
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  return groups.flatMap((group) => {
    const laneEnds: number[] = [];
    const placements = group.map((appointment) => {
      let column = laneEnds.findIndex((end) => end <= appointment.startMinutes);
      if (column < 0) column = laneEnds.length;
      laneEnds[column] = appointment.endMinutes;
      return { appointment, column };
    });
    return placements.map(({ appointment, column }) => ({
      task: appointment.task,
      column,
      columns: laneEnds.length,
      startMinutes: appointment.startMinutes,
      durationMinutes: appointment.endMinutes - appointment.startMinutes,
    }));
  });
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
      accentColor: isHexColor(parsed.accentColor) ? parsed.accentColor : DEFAULT_DATA.accentColor,
      language: parsed.language === "en" ? "en" : "ar",
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<Task>;
  const hasSchedule =
    task.scheduledDate !== undefined ||
    task.startTime !== undefined ||
    task.endTime !== undefined ||
    task.reminderMinutes !== undefined;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.important === "boolean" &&
    typeof task.urgent === "boolean" &&
    typeof task.completed === "boolean" &&
    typeof task.createdAt === "number" &&
    Number.isFinite(task.createdAt) &&
    (!hasSchedule ||
      (typeof task.scheduledDate === "string" &&
        isValidDate(task.scheduledDate) &&
        typeof task.startTime === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(task.startTime) &&
        typeof task.endTime === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(task.endTime) &&
        task.startTime < task.endTime &&
        (task.reminderMinutes === undefined ||
          task.reminderMinutes === null ||
          [5, 10, 15, 30].includes(task.reminderMinutes)) &&
        (task.reminderSentAt === undefined ||
          (typeof task.reminderSentAt === "number" &&
            Number.isFinite(task.reminderSentAt)))))
  );
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
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
    value === "lavender" ||
    value === "custom"
  );
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
}
