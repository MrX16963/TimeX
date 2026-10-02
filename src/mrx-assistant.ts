import { buildPlanSteps, type Language, type Task } from "./lib";
import type { AssistantAction } from "./cloud";

export type MrXResponse = {
  reply: string;
  actions: AssistantAction[];
};

type MrXContext = {
  tasks: Task[];
  userName?: string;
};

export function respondAsMrX(
  input: string,
  language: Language,
  context: MrXContext,
): MrXResponse {
  const message = input.trim();
  if (!message) return { reply: greeting(language, context.userName), actions: [] };

  const taskTitle = getRequestedTask(message, language);
  if (taskTitle.title) {
    return language === "ar"
      ? {
          reply: `أضفت «${taskTitle.title}» إلى مهامك${taskTitle.important || taskTitle.urgent ? ` وصنّفتها ${taskTitle.important ? "مهمة" : ""}${taskTitle.important && taskTitle.urgent ? " و" : ""}${taskTitle.urgent ? "عاجلة" : ""}` : ""}. يمكنك تعديل الموعد أو الأولوية من صفحة المهام.`,
          actions: [{ type: "task", ...taskTitle }],
        }
      : {
          reply: `I added “${taskTitle.title}” to your tasks${taskTitle.important || taskTitle.urgent ? ` and marked it ${taskTitle.important ? "important" : ""}${taskTitle.important && taskTitle.urgent ? " and " : ""}${taskTitle.urgent ? "urgent" : ""}` : ""}. You can adjust its schedule or priority from the tasks page.`,
          actions: [{ type: "task", ...taskTitle }],
        };
  }

  const note = getRequestedNote(message, language);
  if (note) {
    return language === "ar"
      ? {
          reply: `حفظت ملاحظتك «${note.title}» على هذا الجهاز.`,
          actions: [{ type: "note", title: note.title, body: note.body }],
        }
      : {
          reply: `I saved your note “${note.title}” on this device.`,
          actions: [{ type: "note", title: note.title, body: note.body }],
        };
  }

  const goal = getRequestedGoal(message, language);
  if (goal) {
    const steps = buildPlanSteps(goal, language);
    return language === "ar"
      ? {
          reply: `أنشأت خطة «${goal}» من خمس خطوات عملية، وحفظتها وأضفت خطواتها إلى مهامك. ابدأ بأول خطوة، ويمكنك تعديلها أو ترتيب أولويتها.`,
          actions: [{ type: "plan", goal, steps }],
        }
      : {
          reply: `I made a practical five-step plan for “${goal}”, saved it, and added its steps to your tasks. Start with the first step; you can edit or reprioritize it anytime.`,
          actions: [{ type: "plan", goal, steps }],
        };
  }

  if (/مرتبك|مضغوط|غارق|كثير|لا أعرف من أين أبدأ|مو قادر أبدأ|ما عم لحق|محتار|overwhelm|too much|stressed|can't focus|cannot focus/i.test(message)) {
    return overwhelmedGuidance(language, context.tasks);
  }

  if (/\b(today|tasks?|priorit(y|ies)|what next|what should i do first|what.*next|where.*start)\b|مهام|أولوي|اليوم|شو أعمل|ماذا أفعل|بماذا أبدأ/iu.test(message)) {
    return taskGuidance(language, context.tasks);
  }

  return language === "ar"
    ? {
        reply: `أنا MrX، مساعد تخطيط يعمل على جهازك دون تنزيل نموذج. أساعدك في إنشاء خطة بخطوات عملية وإضافتها إلى مهامك، وترتيب أولويات اليوم، وإضافة مهمة أو حفظ ملاحظة. جرّب: «أريد الاستعداد للامتحان» أو «ما أولوياتي اليوم؟»`,
        actions: [],
      }
    : {
        reply: `I'm MrX, an on-device planning helper that needs no model download. I can create a practical step-by-step plan and add it to your tasks, help prioritize today, add a task, or save a note. Try “I want to prepare for my exam” or “What should I do first?”`,
        actions: [],
      };
}

function greeting(language: Language, userName?: string): string {
  if (language === "ar") {
    return userName
      ? `مرحبًا ${userName}، أنا MrX. أخبرني بهدفك أو اطلب مني إضافة مهمة أو حفظ ملاحظة.`
      : "مرحبًا، أنا MrX. أخبرني بهدفك أو اطلب مني إضافة مهمة أو حفظ ملاحظة.";
  }
  return userName
    ? `Hello ${userName}, I'm MrX. Tell me a goal, or ask me to add a task or save a note.`
    : "Hello, I'm MrX. Tell me a goal, or ask me to add a task or save a note.";
}

function getRequestedTask(
  message: string,
  language: Language,
): { title: string; important?: boolean; urgent?: boolean } {
  const pattern = language === "ar"
    ? /(?:أضف|أضيف|سجّل|سجل|أنشئ)\s+(?:لي\s+)?مهم(?:ة|ه)\s*(?:بعنوان|اسمها|[:：-])?\s*(.+)$/u
    : /(?:add|create)\s+(?:me\s+)?(?:a\s+)?task\s*(?:called|to|:|-)?\s*(.+)$/i;
  const content = matchContent(message, pattern);
  const priorityLabels = content.split(/[:：]/u, 1)[0] ?? "";
  const urgent = /عاجل(?:ة)?|urgent/iu.test(priorityLabels);
  const important = /مهم(?:ة|ه)?|ضروري(?:ة)?|important|critical/iu.test(priorityLabels);
  const title = content
    .replace(/^(?:(?:و)?(?:عاجل(?:ة)?|مهم(?:ة|ه)?|ضروري(?:ة)?|urgent|important|critical)\s*[,،:：-]?\s*)+/iu, "")
    .trim();
  return {
    title,
    ...(important ? { important: true } : {}),
    ...(urgent ? { urgent: true } : {}),
  };
}

function getRequestedNote(message: string, language: Language): { title: string; body: string } | null {
  const pattern = language === "ar"
    ? /(?:احفظ|سجّل|سجل|دوّن|دون)\s+(?:لي\s+)?ملاحظ(?:ة|ه)\s*(?:بعنوان|[:：-])?\s*(.+)$/u
    : /(?:save|write)\s+(?:me\s+)?(?:a\s+)?note\s*(?:called|titled|:|-)?\s*(.+)$/i;
  const content = matchContent(message, pattern);
  if (!content) return null;
  const [firstLine, ...remaining] = content.split(/\r?\n/u);
  const separator = firstLine.search(/[:：-]/u);
  const title = separator > 0 ? firstLine.slice(0, separator).trim() : firstLine.trim();
  const body = [
    separator > 0 ? firstLine.slice(separator + 1).trim() : "",
    ...remaining,
  ].filter(Boolean).join("\n").trim() || content;
  return { title: (title || body).slice(0, 100), body: body.slice(0, 3000) };
}

function getRequestedGoal(message: string, language: Language): string {
  const pattern = language === "ar"
    ? /(?:ضع|اعمل|أنشئ|انشئ|ابنِ|ابني|خطّط|خطط)\s+(?:لي\s+)?(?:خطة|خطّة)\s*(?:لـ|ل|من أجل)?\s*(.+)$/u
    : /(?:make|build|create|plan)\s+(?:me\s+)?(?:a\s+)?plan\s*(?:for|to)?\s*(.+)$/i;
  const matched = matchContent(message, pattern);
  if (matched) return matched.replace(/[.!؟?]+$/u, "").trim().slice(0, 200);

  const intentionPattern = language === "ar"
    ? /^(?:أريد|اريد|هدفي|أحتاج|احتاج)\s+(?:أن|ان)?\s*(.+)$/u
    : /^(?:i want to|my goal is to|help me)\s+(.+)$/i;
  const intention = matchContent(message, intentionPattern);
  if (intention) return intention.replace(/^(?:أن|ان)\s*/u, "").slice(0, 200);

  if (language === "ar" && /خطة|خطوات|قسّم|قسم/u.test(message)) {
    return message
      .replace(/^(?:أريد|اريد|ساعدني|كيف)\s*/u, "")
      .replace(/[.!؟?]+$/u, "")
      .slice(0, 200);
  }
  if (language === "en" && /\b(plan|steps|break down)\b/i.test(message)) {
    return message.replace(/[.!?]+$/u, "").slice(0, 200);
  }
  return "";
}

function matchContent(message: string, pattern: RegExp): string {
  const matched = message.match(pattern)?.[1]?.trim() ?? "";
  return matched.replace(/^["'“”‘’]+|["'“”‘’]+$/gu, "").slice(0, 160);
}

function taskGuidance(language: Language, tasks: Task[]): MrXResponse {
  const active = tasks.filter((task) => !task.completed).sort(compareTasks);
  const nextTask = active[0];
  const scheduledToday = active.filter((task) => task.scheduledDate === todayDate());
  const important = active.filter((task) => task.important);
  const urgent = active.filter((task) => task.urgent);
  if (!nextTask) {
    return {
      reply: language === "ar"
        ? "قائمة مهامك خالية الآن. ما أهم نتيجة تريد تحقيقها اليوم؟ يمكنني مساعدتك في تحويلها إلى خطة أو مهمة واضحة."
        : "Your task list is clear for now. What is the most important outcome you want today? I can turn it into a plan or a clear task.",
      actions: [],
    };
  }
  return {
    reply: language === "ar"
      ? `لديك ${active.length} ${active.length === 1 ? "مهمة مفتوحة" : "مهام مفتوحة"}، منها ${important.length} مهمة مهمة و${urgent.length} عاجلة${scheduledToday.length ? ` و${scheduledToday.length} مجدولة اليوم` : ""}. ابدأ بـ«${nextTask.title}»${taskReason(nextTask, language)}، واضبط مؤقت تركيز لـ25 دقيقة. بعد الجلسة أخبرني بما أنجزت لأقترح الخطوة التالية.`
      : `You have ${active.length} open task${active.length === 1 ? "" : "s"}: ${important.length} important, ${urgent.length} urgent${scheduledToday.length ? `, and ${scheduledToday.length} scheduled today` : ""}. Start with “${nextTask.title}”${taskReason(nextTask, language)}, then focus for 25 minutes. Tell me what you finish and I’ll help choose the next step.`,
    actions: [],
  };
}

function overwhelmedGuidance(language: Language, tasks: Task[]): MrXResponse {
  const active = tasks.filter((task) => !task.completed).sort(compareTasks);
  if (!active.length) {
    return {
      reply: language === "ar"
        ? "خلّينا نخفف الضغط: لا توجد مهام مفتوحة الآن. اكتب أهم نتيجة واحدة تتمنى إنجازها، وسأقسمها إلى خطوة صغيرة."
        : "Let's lower the pressure: you have no open tasks. Tell me the one outcome that matters most, and I'll break it into a small first step.",
      actions: [],
    };
  }
  const first = active[0];
  const second = active[1];
  return {
    reply: language === "ar"
      ? `مو لازم تنجز كل شيء الآن. لديك ${active.length} مهام مفتوحة. اخترت «${first.title}» كبداية${taskReason(first, language)}. خذ دقيقة لكتابة أول حركة صغيرة، ثم ركّز عليها 10 دقائق فقط. ${second ? `اترك «${second.title}» لما بعد ذلك.` : "بعدها خذ استراحة قصيرة."}`
      : `You don't need to finish everything now. You have ${active.length} open tasks. Start with “${first.title}”${taskReason(first, language)}. Write down one tiny action and work on it for just 10 minutes. ${second ? `Leave “${second.title}” for later.` : "Take a short break afterward."}`,
    actions: [],
  };
}

function compareTasks(left: Task, right: Task): number {
  const today = todayDate();
  const leftDue = left.scheduledDate && left.scheduledDate <= today ? 0 : 1;
  const rightDue = right.scheduledDate && right.scheduledDate <= today ? 0 : 1;
  if (leftDue !== rightDue) return leftDue - rightDue;
  const leftPriority = Number(left.important) + Number(left.urgent);
  const rightPriority = Number(right.important) + Number(right.urgent);
  if (leftPriority !== rightPriority) return rightPriority - leftPriority;
  if (left.scheduledDate && right.scheduledDate && left.scheduledDate !== right.scheduledDate) {
    return left.scheduledDate.localeCompare(right.scheduledDate);
  }
  return left.createdAt - right.createdAt;
}

function taskReason(task: Task, language: Language): string {
  if (task.scheduledDate && task.scheduledDate <= todayDate()) {
    return language === "ar" ? " لأنها مستحقة اليوم أو متأخرة" : " because it is due today or overdue";
  }
  if (task.important && task.urgent) {
    return language === "ar" ? " لأنها مهمة وعاجلة" : " because it is important and urgent";
  }
  if (task.important) return language === "ar" ? " لأنها مهمة" : " because it is important";
  if (task.urgent) return language === "ar" ? " لأنها عاجلة" : " because it is urgent";
  return "";
}

function todayDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
