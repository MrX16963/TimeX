import { buildPlanSteps, type Language, type Plan, type Task } from "./lib";
import type { AssistantAction } from "./cloud";
import type { ChatMode } from "./assistant-conversations";

export type MrXResponse = {
  reply: string;
  actions: AssistantAction[];
  sources?: Array<{ title: string; url: string }>;
};

type MrXContext = {
  tasks: Task[];
  plans?: Plan[];
  userName?: string;
  researchUnavailable?: boolean;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

export async function respondAsMrX(
  input: string,
  language: Language,
  context: MrXContext,
  mode: ChatMode = "chat",
): Promise<MrXResponse> {
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
    const localModeNotice = mode === "advanced-plan" || context.researchUnavailable
      ? language === "ar"
        ? "لم يتوفر بحث Google الآن، لذلك أنشأت الخطة محليًا دون مصادر ويب."
        : "Google Search isn't available right now, so I created this plan offline without web sources."
      : "";
    return language === "ar"
      ? {
          reply: `${localModeNotice ? `${localModeNotice} ` : ""}أنشأت خطة «${goal}» من خمس خطوات عملية، وحفظتها وأضفت خطواتها إلى مهامك. ابدأ بأول خطوة، ويمكنك تعديلها أو ترتيب أولويتها.`,
          actions: [{ type: "plan", goal, steps }],
        }
      : {
          reply: `${localModeNotice ? `${localModeNotice} ` : ""}I made a practical five-step plan for “${goal}”, saved it, and added its steps to your tasks. Start with the first step; you can edit or reprioritize it anytime.`,
          actions: [{ type: "plan", goal, steps }],
        };
  }

  const planFollowUp = respondToPlanFollowUp(message, language, context.plans ?? []);
  if (planFollowUp) return planFollowUp;

  if (/مرتبك|مضغوط|غارق|كثير|لا أعرف من أين أبدأ|مو قادر أبدأ|ما عم لحق|محتار|overwhelm|too much|stressed|can't focus|cannot focus/i.test(message)) {
    return overwhelmedGuidance(language, context.tasks);
  }

  if (/\b(today|tasks?|priorit(y|ies)|what next|what should i do first|what.*next|where.*start)\b|مهام|أولوي|اليوم|شو أعمل|ماذا أفعل|بماذا أبدأ/iu.test(message)) {
    return taskGuidance(language, context.tasks);
  }

  if (isResearchRequest(message)) {
    return {
      reply: language === "ar"
        ? "البحث في Google يحتاج اتصالًا بخدمة Gemini. سجّل الدخول بعد إعداد الخدمة، أو أخبرني بالموضوع لأساعدك محليًا دون بحث ويب."
        : "Google Search needs the connected Gemini service. Sign in after it's configured, or tell me the topic and I'll help offline without web search.",
      actions: [],
    };
  }

  return conversationalReply(message, language, context);
}

export function isResearchRequest(message: string): boolean {
  return /ابحث|بحث|دور على|دوّر على|على الانترنت|على الإنترنت|مصادر|مصدر|رابط|آخر الأخبار|اخر الاخبار|السعر الحالي|حاليًا|حالياً|google|search|look up|find sources|current|latest|news|weather|price today|source|sources/i.test(message);
}

function respondToPlanFollowUp(
  message: string,
  language: Language,
  plans: Plan[],
): MrXResponse | null {
  const plan = plans[0];
  if (!plan || !/خطو|task|step|plan|خطة|تفصيل|ابدأ|first|next|أبدأ|الأولى|الاولى|الثانية|الثاني|الثالثة|الثالث|الرابعة|الرابع|الخامسة|الخامس/i.test(message)) {
    return null;
  }
  const ordinal = message.match(/(?:ال)?(الأول|الاول|الأولى|الاولى|الثاني|الثانية|الثالث|الثالثة|الرابع|الرابعة|الخامس|الخامسة)|\b(first|second|third|fourth|fifth)\b/i);
  const indexByOrdinal: Record<string, number> = {
    الأول: 0, الاول: 0, الأولى: 0, الاولى: 0, الثاني: 1, الثانية: 1, الثالث: 2,
    الثالثة: 2, الرابع: 3, الرابعة: 3, الخامس: 4, الخامسة: 4,
    first: 0, second: 1, third: 2, fourth: 3, fifth: 4,
  };
  const selectedIndex = ordinal?.[1] ?? ordinal?.[2];
  const index = selectedIndex ? indexByOrdinal[selectedIndex.toLowerCase()] : undefined;
  const selectedStep = index === undefined
    ? undefined
    : { number: index + 1, text: plan.steps[index] };
  if (language === "ar") {
    return {
      reply: selectedStep?.text
        ? `في خطة «${plan.goal}»، الخطوة ${selectedStep.number} هي: «${selectedStep.text}». ابدأ بها بجلسة قصيرة، وإذا أخبرتني بما أنجزته أساعدك في اختيار الخطوة التالية.`
        : `خطتك «${plan.goal}» فيها ${plan.steps.length} خطوات: ${plan.steps.map((item, itemIndex) => `${itemIndex + 1}. ${item}`).join("؛ ")}. أي خطوة تريد أن نفصّلها أو نعدّلها؟`,
      actions: [],
      ...(plan.sources?.length ? { sources: plan.sources } : {}),
    };
  }
  return {
    reply: selectedStep?.text
      ? `In your “${plan.goal}” plan, step ${selectedStep.number} is: “${selectedStep.text}”. Try a short focus session, then tell me what you finish and I’ll help choose what comes next.`
      : `Your “${plan.goal}” plan has ${plan.steps.length} steps: ${plan.steps.map((item, itemIndex) => `${itemIndex + 1}. ${item}`).join("; ")}. Which step would you like to refine?`,
    actions: [],
    ...(plan.sources?.length ? { sources: plan.sources } : {}),
  };
}

function conversationalReply(
  message: string,
  language: Language,
  context: MrXContext,
): MrXResponse {
  if (/^(hi|hello|hey|مرحبا|مرحبًا|أهلًا|اهلا|السلام عليكم)[!؟?.\s]*$/iu.test(message)) {
    return { reply: greeting(language, context.userName), actions: [] };
  }
  if (/^(thanks|thank you|شكرا|شكرًا|يسلمو|مشكور)[!؟?.\s]*$/iu.test(message)) {
    return {
      reply: language === "ar"
        ? "العفو! كيف أقدر أساعدك بعد؟ فيني أبحث عن موضوع يخص هدفك، أشرح خطوة من خطتك، أو أساعدك بترتيب أولوياتك."
        : "You're welcome! What would help next? I can research a goal, walk through a plan step, or help prioritize your tasks.",
      actions: [],
    };
  }
  if (/اشرح|فصّل|وضح|ماذا تقصد|كيف أبدأ|كيف ابدأ|tell me more|explain|what do you mean|how do i start/i.test(message)) {
    const lastAssistantReply = [...(context.history ?? [])]
      .reverse()
      .find((item) => item.role === "assistant")?.content;
    if (lastAssistantReply) {
      const conciseReply = lastAssistantReply.slice(0, 220).replace(/\s+\S*$/, "");
      return {
        reply: language === "ar"
          ? `أكيد. كنا نحكي عن: «${conciseReply}». أي جزء تحب أوضحه أكثر؟`
          : `Of course. We were discussing: “${conciseReply}”. Which part would you like me to unpack?`,
        actions: [],
      };
    }
  }
  if (/^(كيف|شو|ماذا|هل|لماذا|ليش|ساعدني|tell me|how|what|can you|could you|why|help me)/iu.test(message)) {
    return {
      reply: language === "ar"
        ? `أكيد، خلّينا نفكر فيها سوا. عن أي جانب من «${message.slice(0, 100)}» تريد أن نبدأ؟ أقدر أبحث عن معلومات للموضوع، وأحوّل هدفك لخطة، وأساعدك خطوة بخطوة.`
        : `Let's work through it together. Which part of “${message.slice(0, 100)}” should we start with? I can research the topic, turn a goal into a plan, and help you take it one step at a time.`,
      actions: [],
    };
  }
  return language === "ar"
    ? {
        reply: `فهمت عليك: «${message.slice(0, 160)}». شو النتيجة اللي تتمنى توصل لها؟ فيني أبحث عن الموضوع إذا بدك خطة، أقسمه لخطوات، أو نبدأ بأصغر خطوة ممكنة.`,
        actions: [],
      }
    : {
        reply: `I hear you: “${message.slice(0, 160)}”. What outcome are you hoping for? I can research the topic for a plan, break it into steps, or help find one small place to start.`,
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
