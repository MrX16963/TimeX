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
  color?: string;
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
  researchSummary?: string;
  sources?: Array<{ title: string; url: string }>;
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

export function getCalendarWeek(dateKey: string): string[] {
  const [year, month, day] = dateKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, day, 12);
  firstDay.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
}

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
    if (/امتحان|اختبار|شهادة|دراسة|مذاكر|مادة|تعلم|تعلّم|لغة|برمجة/u.test(cleanedGoal)) {
      return [
        `حدّد موعد «${cleanedGoal}» والموضوعات التي يجب تغطيتها`,
        "قسّم الموضوعات إلى جلسات قصيرة، وحدد أول جلسة في التقويم",
        "ادرس موضوعًا واحدًا ثم اختبر نفسك دون الرجوع إلى الملاحظات",
        "راجع الأسئلة أو النقاط الصعبة وركّز على أضعف جزء",
        "أجرِ مراجعة تجريبية، ثم حدّد الخطوة التالية وفق نتيجتها",
      ];
    }
    if (/رياضة|لياقة|تمرين|صحة|مشي|جري|وزن/u.test(cleanedGoal)) {
      return [
        `حدّد نتيجة واقعية وموعدًا لمراجعة التقدم في «${cleanedGoal}»`,
        "اختر نشاطًا مناسبًا لمستواك الحالي واستشر مختصًا عند الحاجة",
        "ابدأ بجلسة قصيرة وخفيفة وسجّل ما أنجزته",
        "حدّد جلستين إضافيتين في الأسبوع مع وقت للراحة",
        "راجع شعورك والتزامك أسبوعيًا وعدّل الخطة تدريجيًا",
      ];
    }
    if (/وظيف|عمل|سيرة|مقابل|مشروع|موقع|تطبيق|إطلاق|إنشاء|بناء/u.test(cleanedGoal)) {
      return [
        `اكتب نتيجة محددة يمكن اعتبار «${cleanedGoal}» منجزًا عند الوصول إليها`,
        "اجمع المتطلبات وحدد أصغر نسخة قابلة للإنجاز",
        "قسّم العمل إلى مهام صغيرة وقدّر وقت أول مهمة",
        "أنجز نسخة أولى واطلب ملاحظات من شخص مناسب",
        "راجع الملاحظات وحدد موعدًا وخطوة الإطلاق التالية",
      ];
    }
    return [
      `اكتب نتيجة واضحة يمكن ملاحظتها عند إنجاز «${cleanedGoal}»`,
      "حدّد أول خطوتين وما تحتاج إليه للبدء",
      "خصص 25 دقيقة لأول خطوة وأبعد مصدر تشتيت واحدًا",
      "سجّل ما أنجزته وما الذي أوقفك",
      "اختر الخطوة التالية وموعدًا قصيرًا لمراجعة تقدمك",
    ];
  }

  if (/\b(exam|test|certification|study|learn|language|programming|course)\b/i.test(cleanedGoal)) {
    return [
      `List the topics and deadline for “${cleanedGoal}”`,
      "Split the topics into short sessions and schedule the first one",
      "Study one topic, then recall it from memory without notes",
      "Review mistakes and spend the next session on the weakest area",
      "Try a timed practice set and adjust your plan from the result",
    ];
  }
  if (/\b(fitness|exercise|work out|health|walk|run|weight)\b/i.test(cleanedGoal)) {
    return [
      `Choose a realistic outcome and a date to review “${cleanedGoal}”`,
      "Pick an activity that fits your current level; ask a professional when needed",
      "Start with a short, easy session and record how it felt",
      "Schedule two more sessions with recovery time between them",
      "Review energy and consistency weekly, then adjust gradually",
    ];
  }
  if (/\b(job|career|resume|interview|project|website|app|launch|build|create)\b/i.test(cleanedGoal)) {
    return [
      `Define a visible result that means “${cleanedGoal}” is done`,
      "Gather requirements and choose the smallest useful first version",
      "Break the work into small tasks and estimate the first one",
      "Complete a first draft and ask one relevant person for feedback",
      "Review feedback and schedule the next delivery step",
    ];
  }
  return [
    `Write a visible result that would mean “${cleanedGoal}” is done`,
    "Choose the first two actions and gather what you need",
    "Set aside 25 minutes for the first action and remove one distraction",
    "Record what you finished and anything that got in the way",
    "Pick the next action and a short time to review your progress",
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
    (task.color === undefined || isHexColor(task.color)) &&
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
          [5, 10, 15, 30, 60].includes(task.reminderMinutes)) &&
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
    (plan.researchSummary === undefined || typeof plan.researchSummary === "string") &&
    (plan.sources === undefined ||
      (Array.isArray(plan.sources) &&
        plan.sources.every(
          (source) =>
            source &&
            typeof source.title === "string" &&
            typeof source.url === "string" &&
            source.url.startsWith("https://"),
        ))) &&
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
