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
  if (taskTitle) {
    return language === "ar"
      ? {
          reply: `سأضيف «${taskTitle}» إلى قائمة مهامك على هذا الجهاز. يمكنك تحديد أهميتها وموعدها من صفحة المهام.`,
          actions: [{ type: "task", title: taskTitle }],
        }
      : {
          reply: `I'll add “${taskTitle}” to your tasks on this device. You can set its priority and schedule from the tasks page.`,
          actions: [{ type: "task", title: taskTitle }],
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
          reply: `جهّزت خطة أولية لهدف «${goal}» من خمس خطوات، وحفظتها في صفحة «خطّط لهدف». راجعها وعدّلها بما يناسبك.`,
          actions: [{ type: "plan", goal, steps }],
        }
      : {
          reply: `I drafted a five-step plan for “${goal}” and saved it to Plan a goal. Review and adapt it to fit your situation.`,
          actions: [{ type: "plan", goal, steps }],
        };
  }

  if (/\b(today|tasks?|priorit(y|ies))\b|مهام|أولوي|اليوم/u.test(message)) {
    return taskGuidance(language, context.tasks);
  }

  return language === "ar"
    ? {
        reply: `أنا MrX، مساعد تخطيط محلي يعمل دون اشتراك أو مفتاح API. أستطيع مساعدتك في تقسيم هدف إلى خطوات، إضافة مهمة، أو حفظ ملاحظة. ما النتيجة التي تريد الوصول إليها؟`,
        actions: [],
      }
    : {
        reply: `I'm MrX, a local planning helper that works without a subscription or API key. I can break a goal into steps, add a task, or save a note. What outcome are you working toward?`,
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

function getRequestedTask(message: string, language: Language): string {
  const pattern = language === "ar"
    ? /(?:أضف|أضيف|سجّل|سجل|أنشئ)\s+(?:لي\s+)?مهم(?:ة|ه)\s*(?:بعنوان|اسمها|[:：-])?\s*(.+)$/u
    : /(?:add|create)\s+(?:me\s+)?(?:a\s+)?task\s*(?:called|to|:|-)?\s*(.+)$/i;
  return matchContent(message, pattern);
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
  const active = tasks.filter((task) => !task.completed);
  const nextTask = active.find((task) => task.important && task.urgent) ??
    active.find((task) => task.important) ??
    active[0];
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
      ? `لديك ${active.length} ${active.length === 1 ? "مهمة" : "مهام"} قيد التنفيذ. ابدأ بـ«${nextTask.title}»${nextTask.important && nextTask.urgent ? " لأنها مهمة وعاجلة" : "، ثم ركّز على خطوة واحدة لمدة 25 دقيقة"}. هل تريد إضافة خطوة تالية؟`
      : `You have ${active.length} active task${active.length === 1 ? "" : "s"}. Start with “${nextTask.title}”${nextTask.important && nextTask.urgent ? " because it is important and urgent" : ", then focus on one step for 25 minutes"}. Would you like to add a next step?`,
    actions: [],
  };
}
