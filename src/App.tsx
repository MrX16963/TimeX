import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { App as NativeApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import type { User } from "@supabase/supabase-js";
import {
  cloudConfigurationMissing,
  createLocalId,
  readChatMessages,
  supabase,
  type AssistantAction,
  type AssistantResponse,
  type ChatMessage,
} from "./cloud";
import {
  buildPlanSteps,
  DEFAULT_DATA,
  getCalendarWeek,
  getQuadrant,
  layoutCalendarTasks,
  readAppData,
  type AppData,
  type Language,
  type Note,
  type Plan,
  type Task,
  type Theme,
} from "./lib";
import {
  type ReminderPermission,
  requestReminderPermission,
  scheduleBrowserReminders,
  syncNativeReminders,
} from "./reminders";
import { respondAsMrX } from "./mrx-assistant";
import { isDoubleBackPress } from "./back-navigation";

const englishCopy = {
    appName: "TimeX",
    tagline: "Make room for what matters.",
    today: "Today",
    calendar: "Schedule",
    calendarIntro: "A clear view of your day, one hour at a time.",
    todayButton: "Today",
    previousDay: "Previous day",
    nextDay: "Next day",
    calendarTasks: "Scheduled tasks",
    calendarEmpty: "Nothing planned for this day.",
    calendarEmptySub: "Add a task with a time to see it on your daily schedule.",
    scheduledTaskPlaceholder: "What needs a place in your day?",
    addScheduledTask: "Add to schedule",
    scheduledDate: "Date",
    startTime: "Starts",
    endTime: "Ends",
    reminder: "Reminder",
    taskColor: "Task color",
    chooseTaskColor: "Choose task color",
    weekOverview: "Week overview",
    noReminder: "No reminder",
    reminderBefore: "{minutes} min before",
    reminderPermissionDenied: "Task saved, but notifications are blocked. Allow notifications in your device settings.",
    reminderUnsupported: "Task saved. Notifications are unavailable in this browser.",
    reminderScheduleFailed: "Could not schedule this reminder. Check your notification settings.",
    timeRangeInvalid: "Choose an end time later than the start time.",
    scheduleTask: "Add date, time & reminder",
    unscheduledCount: "{count} tasks have no scheduled time.",
    taskReminder: "Task reminder",
    reminderBackgroundHint: "Android reminders can arrive while the app is closed. Browsers need TimeX to stay open.",
    matrix: "Priority matrix",
    notes: "Notes",
    planner: "Plan a goal",
    todayLabel: "YOUR DAY, WITH INTENTION",
    greeting: "A little progress adds up.",
    greetingSub: "Choose one thing that matters and begin there.",
    focus: "Focus session",
    focusSub: "One thing at a time. You've got this.",
    start: "Start focus",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    sessionDone: "Focus session complete. Take a mindful break.",
    tasks: "Your tasks",
    tasksSub: "Keep it simple. Keep it moving.",
    addTask: "Add a task",
    taskPlaceholder: "What would you like to get done?",
    add: "Add",
    emptyTasks: "A fresh start.",
    emptyTasksSub: "Add a task above to give your day some direction.",
    important: "Important",
    urgent: "Urgent",
    unprioritized: "Unprioritized",
    markDone: "Mark task complete",
    markOpen: "Mark task incomplete",
    deleteTask: "Delete task",
    completed: "Completed",
    remaining: "In progress",
    points: "Momentum points",
    earned: "+10 points. Nice work!",
    priorities: "Make your priorities visible",
    matrixIntro: "Sort your tasks by importance and urgency to decide what deserves your attention.",
    doNow: "Do now",
    schedule: "Schedule",
    delegate: "Delegate",
    eliminate: "Eliminate",
    doNowHint: "Important + urgent",
    scheduleHint: "Important, not urgent",
    delegateHint: "Urgent, not important",
    eliminateHint: "Neither important nor urgent",
    allCaughtUp: "Nothing here just yet.",
    notesIntro: "A quiet place for ideas, reminders, and everything you want to remember.",
    newNote: "New note",
    noteTitle: "Note title",
    noteBody: "Start writing...",
    noteEmpty: "Your notes are just for you. Create one to get started.",
    deleteNote: "Delete note",
    plannerIntro: "Turn a big intention into a few small, doable next steps.",
    goalLabel: "What would you like to make progress on?",
    goalPlaceholder: "e.g. Prepare for my certification exam",
    makePlan: "Build my plan",
    assistantNote: "MrX can turn a goal into a practical first-step plan locally. The built-in helper uses planning rules, not a trained language model.",
    planSteps: "A gentle place to start",
    addPlanTasks: "Add steps to my tasks",
    planAdded: "Steps added to your task list.",
    pastPlans: "Your plans",
    noPlans: "Your plans will appear here when you create one.",
    theme: "Change theme",
    themeLight: "Comfort · pearl",
    themeMidnight: "Arctic · blue",
    themeSage: "Forest · emerald",
    themeLavender: "Amethyst · violet",
    themeCustom: "My accent",
    themeSelection: "Choose your colors",
    themeCustomColor: "Choose a favorite color",
    themePaletteHint: "A black canvas with a gentle silver glow.",
    language: "Language",
    switchLanguage: "العربية",
    storageWarning: "This browser could not save your changes. Check your storage settings and try again.",
    dismiss: "Dismiss",
    taskAdded: "Task added.",
    noteCreated: "A new note is ready.",
    pointsHint: "Earn points each time you complete a task.",
    savedOnDevice: "Saved on this device",
    deletePlan: "Delete plan",
    close: "Close",
    saveNoteHint: "Notes save automatically",
    installApp: "Install app",
    installTitle: "Take TimeX with you",
    installHelp: "Install TimeX from your browser menu to use it like an app. Your saved tasks and notes stay on this device.",
    installDesktop: "On a computer, choose “Install app” or “Install TimeX” from the browser menu or address bar.",
    installAndroid: "On Android, open the browser menu and choose “Install app” or “Add to Home screen.”",
    installApple: "On iPhone or iPad, open this page in Safari, tap Share, then choose “Add to Home Screen.”",
    installFailed: "The browser could not start installation. Try the install option in its menu instead.",
    account: "Account",
    signIn: "Sign in",
    signOut: "Sign out",
    welcomeWithName: "Welcome, {name}. A little progress adds up.",
    accountHelp: "Sign in to keep your private workspace in sync across your devices.",
    accountNotConfigured: "Email, Google, and Facebook sign-in use Supabase Auth, but the public Supabase client key is not configured for this build yet. MrX remains available locally.",
    displayName: "Your name",
    email: "Email address",
    password: "Password",
    createAccount: "Create account",
    haveAccount: "Already have an account? Sign in",
    needAccount: "New to TimeX? Create an account",
    continueGoogle: "Continue with Google",
    continueFacebook: "Continue with Facebook",
    accountError: "We couldn't complete that account request. Check your details and try again.",
    confirmationSent: "Check your email to confirm your account, then sign in.",
    greetingName: "Hello {name}, I'm MrX. I can help turn goals into steps, add tasks, and save notes.",
    assistantChat: "MrX · planning companion",
    assistantTab: "Assistant",
    assistantChatSub: "A free, on-device helper for goals, tasks, and notes.",
    localAssistantLabel: "On-device",
    assistantChatPlaceholder: "What would you like to talk through?",
    sendMessage: "Send message",
    signInForChat: "Sign in to sync your chat. MrX can help locally without an account.",
    configureForChat: "MrX works locally without an API key. Sign-in and cloud sync can be enabled after Supabase setup.",
    mrxLocalMode: "MrX local mode: practical planning help runs on this device without a paid AI service. Local replies are not generated by a trained language model.",
    assistantLocalFallback: "The connected AI service was unavailable, so MrX answered locally instead.",
    pressAgainToExit: "Press back again to exit TimeX.",
    assistantChatError: "I couldn't reach the planning assistant. Check its server configuration and try again.",
    chatSavingError: "Your workspace is saved, but a chat message couldn't be synced.",
    cloudSyncError: "Cloud sync is temporarily unavailable. Your changes are saved on this device.",
    accountStatus: "Your account",
    localWorkspace: "Local workspace",
    cloudWorkspace: "Private cloud workspace",
    loadingWorkspace: "Loading your private workspace…",
    authenticationRequired: "Create an account or sign in to sync your own workspace across devices.",
    signInSuccessful: "Welcome back.",
    assistantPrivacy: "MrX's built-in helper runs on this device. When you sign in, your chat history syncs to your private Supabase account; messages are sent to an AI provider only when one is configured.",
};

const arabicCopy = {
    appName: "TimeX",
    tagline: "اترك مساحة لما يهمك.",
    today: "اليوم",
    calendar: "الجدول",
    calendarIntro: "نظرة واضحة على يومك، ساعةً بساعة.",
    todayButton: "اليوم",
    previousDay: "اليوم السابق",
    nextDay: "اليوم التالي",
    calendarTasks: "المهام المجدولة",
    calendarEmpty: "لا توجد مهام مخططة لهذا اليوم.",
    calendarEmptySub: "أضف مهمة وحدّد وقتها لتظهر في جدولك اليومي.",
    scheduledTaskPlaceholder: "ما المهمة التي تريد إدراجها في يومك؟",
    addScheduledTask: "أضف إلى الجدول",
    scheduledDate: "التاريخ",
    startTime: "البدء",
    endTime: "الانتهاء",
    reminder: "التذكير",
    taskColor: "لون المهمة",
    chooseTaskColor: "اختر لون المهمة",
    weekOverview: "أيام الأسبوع",
    noReminder: "دون تذكير",
    reminderBefore: "قبل {minutes} دقيقة",
    reminderPermissionDenied: "حُفظت المهمة، لكن الإشعارات محظورة. اسمح بها من إعدادات جهازك.",
    reminderUnsupported: "حُفظت المهمة. الإشعارات غير متاحة في هذا المتصفح.",
    reminderScheduleFailed: "تعذّر ضبط التذكير. تحقق من إعدادات الإشعارات.",
    timeRangeInvalid: "اختر وقت انتهاء بعد وقت البدء.",
    scheduleTask: "إضافة تاريخ ووقت وتذكير",
    unscheduledCount: "لديك {count} مهام دون وقت محدد.",
    taskReminder: "تذكير بمهمة",
    reminderBackgroundHint: "تعمل تذكيرات أندرويد حتى عند إغلاق التطبيق. يحتاج المتصفح إلى بقاء TimeX مفتوحًا.",
    matrix: "مصفوفة الأولويات",
    notes: "ملاحظاتي",
    planner: "خطّط لهدف",
    todayLabel: "يومك، بوعي",
    greeting: "كل تقدّم صغير يصنع فرقًا.",
    greetingSub: "اختر أمرًا واحدًا مهمًا وابدأ به.",
    focus: "جلسة تركيز",
    focusSub: "شيء واحد في كل مرة. أنت قادر.",
    start: "ابدأ التركيز",
    pause: "إيقاف مؤقت",
    resume: "متابعة",
    reset: "إعادة",
    sessionDone: "اكتملت جلسة التركيز. خذ استراحة هادئة.",
    tasks: "مهامي",
    tasksSub: "بسّط يومك، وخذ خطوة.",
    addTask: "أضف مهمة",
    taskPlaceholder: "ما الذي ترغب في إنجازه؟",
    add: "إضافة",
    emptyTasks: "بداية جديدة.",
    emptyTasksSub: "أضف مهمة أعلاه لتمنح يومك اتجاهًا.",
    important: "مهم",
    urgent: "عاجل",
    unprioritized: "بلا أولوية",
    markDone: "إكمال المهمة",
    markOpen: "إعادة فتح المهمة",
    deleteTask: "حذف المهمة",
    completed: "مكتملة",
    remaining: "قيد الإنجاز",
    points: "نقاط التقدّم",
    earned: "أُضيفت ١٠ نقاط. أحسنت!",
    priorities: "رتّب أولوياتك بوضوح",
    matrixIntro: "صنّف مهامك حسب الأهمية والاستعجال لتعرف ما يستحق انتباهك.",
    doNow: "أنجز الآن",
    schedule: "خطّط لوقت",
    delegate: "فوّض",
    eliminate: "استبعد",
    doNowHint: "مهم وعاجل",
    scheduleHint: "مهم، غير عاجل",
    delegateHint: "عاجل، غير مهم",
    eliminateHint: "غير مهم وغير عاجل",
    allCaughtUp: "لا توجد مهام هنا بعد.",
    notesIntro: "مساحة هادئة لأفكارك وتذكيراتك وكل ما تريد الاحتفاظ به.",
    newNote: "ملاحظة جديدة",
    noteTitle: "عنوان الملاحظة",
    noteBody: "ابدأ الكتابة...",
    noteEmpty: "ملاحظاتك لك وحدك. أنشئ ملاحظة للبدء.",
    deleteNote: "حذف الملاحظة",
    plannerIntro: "حوّل ما تطمح إليه إلى خطوات صغيرة قابلة للتنفيذ.",
    goalLabel: "ما الهدف الذي ترغب في التقدّم نحوه؟",
    goalPlaceholder: "مثال: الاستعداد لاختبار الشهادة المهنية",
    makePlan: "أنشئ خطتي",
    assistantNote: "يساعدك MrX محليًا في تحويل الهدف إلى خطوات أولية عملية. يعتمد المساعد المدمج على قواعد تخطيط، وليس نموذجًا لغويًا مدرّبًا.",
    planSteps: "خطوة هادئة للبدء",
    addPlanTasks: "أضف الخطوات إلى مهامي",
    planAdded: "أُضيفت الخطوات إلى مهامك.",
    pastPlans: "خططي",
    noPlans: "ستظهر خططك هنا بعد إنشاء أول خطة.",
    theme: "تغيير المظهر",
    themeLight: "الوضع المريح",
    themeMidnight: "قطبي · أزرق",
    themeSage: "غابة · زمردي",
    themeLavender: "جمشت · بنفسجي",
    themeCustom: "لوني المفضّل",
    themeSelection: "اختر ألوانك",
    themeCustomColor: "اختر لونك المفضّل",
    themePaletteHint: "خلفية سوداء يتخلّلها وهج فضي هادئ.",
    language: "اللغة",
    switchLanguage: "English",
    storageWarning: "تعذّر على هذا المتصفح حفظ التغييرات. تحقق من إعدادات التخزين ثم حاول مجددًا.",
    dismiss: "إغلاق",
    taskAdded: "أُضيفت المهمة.",
    noteCreated: "ملاحظتك الجديدة جاهزة.",
    pointsHint: "اجمع النقاط كلما أتممت مهمة.",
    savedOnDevice: "محفوظ على هذا الجهاز",
    deletePlan: "حذف الخطة",
    close: "إغلاق",
    saveNoteHint: "تُحفظ الملاحظات تلقائيًا",
    installApp: "تثبيت التطبيق",
    installTitle: "TimeX معك أينما ذهبت",
    installHelp: "ثبّت TimeX من قائمة المتصفح لاستخدامه كتطبيق. تبقى مهامك وملاحظاتك المحفوظة على هذا الجهاز.",
    installDesktop: "على الكمبيوتر، اختر «تثبيت التطبيق» أو «تثبيت TimeX» من قائمة المتصفح أو شريط العنوان.",
    installAndroid: "على أندرويد، افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
    installApple: "على iPhone أو iPad، افتح الصفحة في Safari، واضغط «مشاركة»، ثم «إضافة إلى الشاشة الرئيسية».",
    installFailed: "تعذّر بدء التثبيت. جرّب خيار التثبيت من قائمة المتصفح.",
    account: "الحساب",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    welcomeWithName: "أهلًا {name}، كل تقدّم صغير يصنع فرقًا.",
    accountHelp: "سجّل الدخول لمزامنة مساحتك الخاصة بين أجهزتك.",
    accountNotConfigured: "يُرسل تسجيل البريد وGoogle وFacebook إلى Supabase Auth، لكن مفتاح Supabase العام غير مضبوط في هذه النسخة بعد. يظل MrX متاحًا محليًا.",
    displayName: "اسمك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    createAccount: "إنشاء حساب",
    haveAccount: "لديك حساب بالفعل؟ سجّل الدخول",
    needAccount: "جديد في TimeX؟ أنشئ حسابًا",
    continueGoogle: "المتابعة باستخدام Google",
    continueFacebook: "المتابعة باستخدام Facebook",
    accountError: "تعذّر إكمال طلب الحساب. تحقق من بياناتك ثم حاول مجددًا.",
    confirmationSent: "تحقق من بريدك لتأكيد حسابك ثم سجّل الدخول.",
    greetingName: "مرحبًا {name}، أنا MrX. أساعدك في تحويل الأهداف إلى خطوات وإضافة المهام وحفظ الملاحظات.",
    assistantChat: "MrX · مساعد التخطيط",
    assistantTab: "المساعد",
    assistantChatSub: "مساعد مجاني على جهازك للأهداف والمهام والملاحظات.",
    localAssistantLabel: "على الجهاز",
    assistantChatPlaceholder: "ما الموضوع الذي ترغب في مناقشته؟",
    sendMessage: "إرسال الرسالة",
    signInForChat: "سجّل الدخول لمزامنة المحادثة. MrX متاح محليًا دون حساب.",
    configureForChat: "يعمل MrX محليًا دون مفتاح API. يمكن تفعيل تسجيل الدخول والمزامنة بعد إعداد Supabase.",
    mrxLocalMode: "وضع MrX المحلي: يقدم مساعدة عملية للتخطيط على هذا الجهاز دون خدمة ذكاء اصطناعي مدفوعة. الردود المحلية ليست ناتجة عن نموذج لغوي مدرّب.",
    assistantLocalFallback: "تعذّر الوصول إلى خدمة الذكاء الاصطناعي المرتبطة، لذا أجاب MrX محليًا.",
    pressAgainToExit: "اضغط زر الرجوع مرة أخرى للخروج من TimeX.",
    assistantChatError: "تعذّر الاتصال بمساعد التخطيط. تحقق من إعداد الخادم ثم حاول مجددًا.",
    chatSavingError: "حُفظت مساحتك، لكن تعذّرت مزامنة رسالة من المحادثة.",
    cloudSyncError: "المزامنة السحابية غير متاحة مؤقتًا. حُفظت تغييراتك على هذا الجهاز.",
    accountStatus: "حسابك",
    localWorkspace: "مساحة محلية",
    cloudWorkspace: "مساحة سحابية خاصة",
    loadingWorkspace: "جارٍ تحميل مساحتك الخاصة…",
    authenticationRequired: "أنشئ حسابًا أو سجّل الدخول لمزامنة مساحتك الخاصة بين الأجهزة.",
    signInSuccessful: "أهلًا بعودتك.",
    assistantPrivacy: "يعمل مساعد MrX المدمج على هذا الجهاز. عند تسجيل الدخول، تُزامن المحادثة مع حسابك الخاص في Supabase؛ ولا تُرسل الرسائل إلى مزوّد خارجي إلا عند إعداد واحد.",
} satisfies Record<keyof typeof englishCopy, string>;

const copy = {
  en: englishCopy,
  ar: arabicCopy,
} satisfies Record<Language, Record<string, string>>;

type CopyKey = keyof typeof copy.en;
type Page = "today" | "calendar" | "matrix" | "notes" | "planner" | "assistant";
type AuthMode = "sign-in" | "sign-up";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type TaskSchedule = Required<
  Pick<Task, "scheduledDate" | "startTime" | "endTime" | "reminderMinutes" | "color">
>;

const themeOrder: Exclude<Theme, "custom">[] = ["light", "midnight", "sage", "lavender"];

function makeId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getContrastTextColor(hex: string): string {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const luminance = channels
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#08090b" : "#ffffff";
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(dateKey: string, amount: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + amount);
  return getLocalDateKey(date);
}

function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function loadData(): AppData {
  return loadDataForKey("timex-data");
}

function loadDataForKey(key: string): AppData {
  try {
    return readAppData(window.localStorage.getItem(key));
  } catch {
    return DEFAULT_DATA;
  }
}

function accountStorageKey(userId: string | undefined): string {
  return userId ? `timex-data:${userId}` : "timex-data";
}

function chatStorageKey(userId: string | undefined): string {
  return userId ? `timex-chat:${userId}` : "timex-chat";
}

function getDisplayName(user: User | null): string {
  if (!user) return "";
  const name = user.user_metadata?.display_name || user.user_metadata?.full_name;
  return typeof name === "string" && name.trim()
    ? name.trim().split(/\s+/)[0]
    : user.email?.split("@")[0] || "";
}

function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => getLocalDateKey(new Date()));
  const [calendarTaskTitle, setCalendarTaskTitle] = useState("");
  const [calendarStartTime, setCalendarStartTime] = useState("09:00");
  const [calendarEndTime, setCalendarEndTime] = useState("10:00");
  const [calendarReminder, setCalendarReminder] = useState<number | null>(10);
  const [calendarTaskColor, setCalendarTaskColor] = useState("#6a9cff");
  const [page, setPage] = useState<Page>("today");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskImportant, setTaskImportant] = useState(false);
  const [taskUrgent, setTaskUrgent] = useState(false);
  const [taskScheduleOpen, setTaskScheduleOpen] = useState(false);
  const [taskScheduledDate, setTaskScheduledDate] = useState(() => getLocalDateKey(new Date()));
  const [taskStartTime, setTaskStartTime] = useState("09:00");
  const [taskEndTime, setTaskEndTime] = useState("10:00");
  const [taskReminder, setTaskReminder] = useState<number | null>(10);
  const [taskColor, setTaskColor] = useState("#6a9cff");
  const [matrixTaskTitle, setMatrixTaskTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [toast, setToast] = useState("");
  const [storageFailed, setStorageFailed] = useState(false);
  const [cloudSyncFailed, setCloudSyncFailed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(supabase === null);
  const [workspaceReady, setWorkspaceReady] = useState(supabase === null);
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [showAccount, setShowAccount] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    readChatMessages("timex-chat"),
  );
  const [chatInput, setChatInput] = useState("");
  const [chatPending, setChatPending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatNotice, setChatNotice] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [appInstalled, setAppInstalled] = useState(() =>
    Capacitor.isNativePlatform() ||
    window.timexExternal !== undefined ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const installCloseRef = useRef<HTMLButtonElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const themePickerRef = useRef<HTMLElement>(null);
  const lang = data.language;
  const isArabic = lang === "ar";
  const t = (key: CopyKey) => copy[lang][key];
  const userName = getDisplayName(user);
  const greeting = userName
    ? t("welcomeWithName").replace("{name}", userName)
    : t("greeting");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const authCloseRef = useRef<HTMLButtonElement>(null);
  const activeUserId = useRef<string | null>(null);
  const lastAndroidBackPress = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [isArabic, lang]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    const listener = NativeApp.addListener("backButton", () => {
      if (showAccount) {
        setShowAccount(false);
        lastAndroidBackPress.current = null;
        return;
      }
      if (showInstallHelp) {
        setShowInstallHelp(false);
        lastAndroidBackPress.current = null;
        return;
      }
      const now = Date.now();
      if (isDoubleBackPress(now, lastAndroidBackPress.current)) {
        void NativeApp.exitApp();
        return;
      }
      lastAndroidBackPress.current = now;
      if (page !== "today") setPage("today");
      notify(t("pressAgainToExit"));
    });
    return () => {
      void listener.then((subscription) => subscription.remove());
    };
  }, [lang, page, showAccount, showInstallHelp]);

  useEffect(() => {
    if (!showThemePicker) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowThemePicker(false);
      themeButtonRef.current?.focus();
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        !themePickerRef.current?.contains(event.target) &&
        !themeButtonRef.current?.contains(event.target)
      ) {
        setShowThemePicker(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [showThemePicker]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    function applySession(nextUser: User | null) {
      if (!active) return;
      const nextId = nextUser?.id ?? null;
      setSessionReady(true);
      if (activeUserId.current !== nextId) {
        activeUserId.current = nextId;
        setWorkspaceReady(false);
        setUser(nextUser);
      }
    }

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      applySession(session?.user ?? null);
      if (event === "SIGNED_IN") setShowAccount(false);
    });

    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("TimeX could not restore the sign-in session.", error);
      }
      applySession(data.session?.user ?? null);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    async function completeNativeOAuth(
      url: string,
      authClient: NonNullable<typeof supabase>,
    ) {
      if (
        !url.startsWith("com.mrxosa.timex://login-callback") &&
        !url.startsWith("timex://login-callback")
      ) {
        return;
      }

      try {
        await Browser.close().catch(() => undefined);
        const callback = new URL(url);
        const authError = callback.searchParams.get("error_description");
        if (authError) throw new Error(authError);

        const code = callback.searchParams.get("code");
        if (!code) throw new Error("The sign-in response did not include a session code.");
        const { error } = await authClient.auth.exchangeCodeForSession(code);
        if (error) throw error;
        setAuthError("");
        setAuthNotice(t("signInSuccessful"));
      } catch (error) {
        console.error("TimeX could not complete native social sign-in.", error);
        setAuthError(t("accountError"));
        setShowAccount(true);
      }
    }

    const nativeListener = Capacitor.isNativePlatform()
      ? NativeApp.addListener("appUrlOpen", ({ url }) => {
          void completeNativeOAuth(url, client);
        })
      : null;
    const handleDesktopOAuth = (event: Event) => {
      const url = (event as CustomEvent<string>).detail;
      if (typeof url === "string") void completeNativeOAuth(url, client);
    };
    window.addEventListener("timex-auth-callback", handleDesktopOAuth);

    return () => {
      window.removeEventListener("timex-auth-callback", handleDesktopOAuth);
      void nativeListener?.then((listener) => listener.remove());
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    if (!supabase) {
      setWorkspaceReady(true);
      return;
    }

    let active = true;
    setWorkspaceReady(false);
    setCloudSyncFailed(false);

    if (!user) {
      setData(loadDataForKey(accountStorageKey(undefined)));
      setChatMessages(readChatMessages(chatStorageKey(undefined)));
      setWorkspaceReady(true);
      return () => {
        active = false;
      };
    }

    void (async () => {
      const [workspaceResult, profileResult, messagesResult] = await Promise.all([
        supabase
          .from("user_workspaces")
          .select("data")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("assistant_messages")
          .select("id, role, content, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (!active) return;

      if (workspaceResult.error || profileResult.error || messagesResult.error) {
        const error =
          workspaceResult.error || profileResult.error || messagesResult.error;
        console.error("TimeX could not load the private user workspace.", error);
        setCloudSyncFailed(true);
      }

      if (profileResult.data?.display_name) {
        const displayName = profileResult.data.display_name;
        setUser((current) =>
          current
            ? {
                ...current,
                user_metadata: {
                  ...current.user_metadata,
                  display_name: displayName,
                },
              }
            : current,
        );
      }

      const savedWorkspace = workspaceResult.data?.data;
      setData(
        savedWorkspace
          ? readAppData(JSON.stringify(savedWorkspace))
          : loadDataForKey(accountStorageKey(user.id)),
      );
      const messages = ((messagesResult.data ?? []) as ChatMessage[]).reverse();
      setChatMessages(messages.length ? messages.slice(-100) : readChatMessages(chatStorageKey(user.id)));
      setWorkspaceReady(true);
    })().catch((error: unknown) => {
      if (!active) return;
      console.error("TimeX could not load the private user workspace.", error);
      setCloudSyncFailed(true);
      setData(loadDataForKey(accountStorageKey(user.id)));
      setChatMessages(readChatMessages(chatStorageKey(user.id)));
      setWorkspaceReady(true);
    });

    return () => {
      active = false;
    };
  }, [sessionReady, user?.id]);

  useEffect(() => {
    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setAppInstalled(true);
      setInstallPrompt(null);
      setShowInstallHelp(false);
    };
    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (showInstallHelp) installCloseRef.current?.focus();
  }, [showInstallHelp]);

  useEffect(() => {
    if (showAccount) authCloseRef.current?.focus();
  }, [showAccount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, chatPending]);

  useEffect(() => {
    if (!sessionReady || !workspaceReady) return;
    const storageKey = accountStorageKey(user?.id);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }, [data, sessionReady, user?.id, workspaceReady]);

  useEffect(() => {
    const client = supabase;
    if (!sessionReady || !workspaceReady || !user || !client) return;
    const timer = window.setTimeout(() => {
      void client
        .from("user_workspaces")
        .upsert(
          { user_id: user.id, data, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        )
        .then(({ error }) => {
          if (error) {
            console.error("TimeX could not sync the private workspace.", error);
            setCloudSyncFailed(true);
          } else {
            setCloudSyncFailed(false);
          }
        });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [data, sessionReady, user, workspaceReady]);

  useEffect(() => {
    if (!sessionReady || !workspaceReady) return;
    try {
      window.localStorage.setItem(chatStorageKey(user?.id), JSON.stringify(chatMessages));
    } catch {
      setStorageFailed(true);
    }
  }, [chatMessages, sessionReady, user?.id, workspaceReady]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0) setRunning(false);
  }, [secondsLeft]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      void syncNativeReminders(data.tasks, lang).catch((error: unknown) => {
        console.error("TimeX could not sync native task reminders.", error);
        notify(copy[lang].reminderScheduleFailed);
      });
      return;
    }

    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    return scheduleBrowserReminders(data.tasks, lang, (taskId) => {
      setData((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === taskId ? { ...task, reminderSentAt: Date.now() } : task,
        ),
      }));
    });
  }, [data.tasks, lang]);

  const openTasks = useMemo(
    () => data.tasks.filter((task) => !task.completed),
    [data.tasks],
  );
  const completedCount = data.tasks.filter((task) => task.completed).length;
  const calendarTasks = data.tasks.filter((task) => task.scheduledDate === calendarDate);
  const calendarLayout = layoutCalendarTasks(calendarTasks);
  const calendarWeek = getCalendarWeek(calendarDate);
  const unscheduledCount = openTasks.filter((task) => !task.scheduledDate).length;
  const selectedCalendarDate = dateFromKey(calendarDate);
  const calendarDateLabel = new Intl.DateTimeFormat(lang, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(selectedCalendarDate);
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function addTask(
    title: string,
    important = false,
    urgent = false,
    schedule?: TaskSchedule,
  ) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task: Task = {
      id: makeId(),
      title: trimmed,
      important,
      urgent,
      completed: false,
      createdAt: Date.now(),
      ...schedule,
    };
    setData((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    notify(t("taskAdded"));
  }

  async function checkReminderPermission(): Promise<ReminderPermission> {
    try {
      return await requestReminderPermission();
    } catch (error) {
      console.error("TimeX could not request notification permission.", error);
      return "denied";
    }
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const schedule = taskScheduleOpen
      ? {
          scheduledDate: taskScheduledDate,
          startTime: taskStartTime,
          endTime: taskEndTime,
          reminderMinutes: taskReminder,
          color: taskColor,
        }
      : undefined;
    if (schedule && schedule.endTime <= schedule.startTime) {
      notify(t("timeRangeInvalid"));
      return;
    }
    const permission = schedule?.reminderMinutes != null
      ? await checkReminderPermission()
      : null;
    addTask(taskTitle, taskImportant, taskUrgent, schedule);
    setTaskTitle("");
    setTaskImportant(false);
    setTaskUrgent(false);
    if (permission && permission !== "granted") {
      notify(t(permission === "unsupported" ? "reminderUnsupported" : "reminderPermissionDenied"));
    }
  }

  async function submitCalendarTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (calendarEndTime <= calendarStartTime) {
      notify(t("timeRangeInvalid"));
      return;
    }
    const permission = calendarReminder !== null
      ? await checkReminderPermission()
      : null;
    addTask(calendarTaskTitle, false, false, {
      scheduledDate: calendarDate,
      startTime: calendarStartTime,
      endTime: calendarEndTime,
      reminderMinutes: calendarReminder,
      color: calendarTaskColor,
    });
    setCalendarTaskTitle("");
    if (permission && permission !== "granted") {
      notify(t(permission === "unsupported" ? "reminderUnsupported" : "reminderPermissionDenied"));
    }
  }

  function setCalendarDay(amount: number) {
    setCalendarDate((current) => shiftDate(current, amount));
  }

  async function updateTaskReminder(taskId: string, reminder: number | null) {
    if (reminder !== null) {
      const permission = await checkReminderPermission();
      if (permission !== "granted") {
        notify(t(permission === "unsupported" ? "reminderUnsupported" : "reminderPermissionDenied"));
        return;
      }
    }
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, reminderMinutes: reminder, reminderSentAt: undefined } : task,
      ),
    }));
  }

  function updateTaskColor(taskId: string, color: string) {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId ? { ...task, color } : task),
    }));
  }

  function formatCalendarTime(time: string): string {
    const [hour, minute] = time.split(":").map(Number);
    return new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit" })
      .format(new Date(selectedCalendarDate.getFullYear(), selectedCalendarDate.getMonth(), selectedCalendarDate.getDate(), hour, minute));
  }

  function formatHour(hour: number): string {
    return formatCalendarTime(`${String(hour).padStart(2, "0")}:00`);
  }

  function toggleTask(taskId: string) {
    const target = data.tasks.find((task) => task.id === taskId);
    if (!target) return;
    const completing = !target.completed;
    setData((current) => ({
      ...current,
      points: completing ? current.points + 10 : current.points,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    }));
    if (completing) notify(t("earned"));
  }

  function deleteTask(taskId: string) {
    setData((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
    }));
  }

  function createNote() {
    const note: Note = {
      id: makeId(),
      title: "",
      body: "",
      updatedAt: Date.now(),
    };
    setData((current) => ({ ...current, notes: [note, ...current.notes] }));
    notify(t("noteCreated"));
  }

  function updateNote(noteId: string, updates: Partial<Note>) {
    setData((current) => ({
      ...current,
      notes: current.notes.map((note) =>
        note.id === noteId
          ? { ...note, ...updates, updatedAt: Date.now() }
          : note,
      ),
    }));
  }

  function buildPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const steps = buildPlanSteps(goal, lang);
    if (!steps.length) return;
    const plan: Plan = {
      id: makeId(),
      goal: goal.trim(),
      steps,
      createdAt: Date.now(),
    };
    setData((current) => ({ ...current, plans: [plan, ...current.plans] }));
    setGoal("");
  }

  function addPlanToTasks(plan: Plan) {
    const tasks = plan.steps.map((title): Task => ({
      id: makeId(),
      title,
      important: false,
      urgent: false,
      completed: false,
      createdAt: Date.now(),
    }));
    setData((current) => ({ ...current, tasks: [...tasks, ...current.tasks] }));
    notify(t("planAdded"));
  }

  async function installApp() {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (choice.outcome === "accepted") setAppInstalled(true);
    } catch (error) {
      console.error("TimeX installation prompt failed.", error);
      setInstallPrompt(null);
      notify(t("installFailed"));
    }
  }

  function getAuthenticationRedirect(): string {
    if (Capacitor.getPlatform() === "android") {
      return "com.mrxosa.timex://login-callback";
    }
    if (window.timexExternal) return "timex://login-callback";
    return new URL(`${import.meta.env.BASE_URL}app.html`, window.location.origin).href;
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setAuthPending(true);
    setAuthError("");
    setAuthNotice("");
    try {
      const response =
        authMode === "sign-up"
          ? await supabase.auth.signUp({
              email: authEmail.trim(),
              password: authPassword,
              options: {
                data: { display_name: authName.trim() },
                emailRedirectTo: getAuthenticationRedirect(),
              },
            })
          : await supabase.auth.signInWithPassword({
              email: authEmail.trim(),
              password: authPassword,
            });
      if (response.error) throw response.error;

      if (authMode === "sign-up" && !response.data.session) {
        setAuthNotice(t("confirmationSent"));
      } else if (response.data.user) {
        setAuthNotice(t("signInSuccessful"));
        setAuthPassword("");
      }
    } catch (error) {
      console.error("TimeX email authentication failed.", error);
      setAuthError(t("accountError"));
    } finally {
      setAuthPending(false);
    }
  }

  async function signInWithProvider(provider: "google" | "facebook") {
    if (!supabase) return;
    setAuthPending(true);
    setAuthError("");
    try {
      const nativeAndroid = Capacitor.getPlatform() === "android";
      const nativeWindows = window.timexExternal !== undefined;
      const native = nativeAndroid || nativeWindows;
      const { data: oauth, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthenticationRedirect(),
          skipBrowserRedirect: native,
        },
      });
      if (error) throw error;
      if (native && oauth.url) {
        if (nativeAndroid) {
          await Browser.open({ url: oauth.url });
        } else {
          await window.timexExternal?.openExternal(oauth.url);
        }
      }
      setAuthPending(false);
    } catch (error) {
      console.error(`TimeX ${provider} sign-in failed.`, error);
      setAuthError(t("accountError"));
      setAuthPending(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setAuthPending(true);
    setAuthError("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("TimeX could not sign out.", error);
      setAuthError(t("accountError"));
      setAuthPending(false);
      return;
    }
    setShowAccount(false);
    setAuthPending(false);
  }

  async function storeAssistantMessage(message: ChatMessage, userId: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from("assistant_messages")
      .insert({
        id: message.id,
        user_id: userId,
        role: message.role,
        content: message.content,
      });
    if (error) {
      console.error("TimeX could not sync a private assistant message.", error);
      setCloudSyncFailed(true);
    }
  }

  async function sendAssistantMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || chatPending) return;

    const userMessage: ChatMessage = {
      id: createLocalId(),
      role: "user",
      content: content.slice(0, 4000),
      created_at: new Date().toISOString(),
    };
    const conversation = [...chatMessages, userMessage].slice(-100);
    setChatMessages(conversation);
    setChatInput("");
    setChatError("");
    setChatNotice("");
    setChatPending(true);
    if (user && supabase) void storeAssistantMessage(userMessage, user.id);

    try {
      let response: AssistantResponse | null = null;
      if (user && supabase) {
        try {
          const { data, error } = await supabase.functions.invoke<AssistantResponse>(
            "timex-assistant",
            {
              body: {
                messages: conversation.slice(-20).map(({ role, content: text }) => ({
                  role,
                  content: text,
                })),
                language: lang,
                userName,
              },
            },
          );
          if (error) throw error;
          if (
            !data ||
            typeof data.reply !== "string" ||
            !data.reply.trim() ||
            data.reply.length > 8000 ||
            !Array.isArray(data.actions)
          ) {
            throw new Error("The configured assistant returned an invalid response.");
          }
          response = data;
        } catch (error) {
          console.error("TimeX could not reach the configured assistant; using MrX locally.", error);
          setChatNotice(t("assistantLocalFallback"));
        }
      }

      const localResponse = response
        ? null
        : respondAsMrX(content, lang, { tasks: data.tasks, userName });
      const assistantMessage: ChatMessage = {
        id: createLocalId(),
        role: "assistant",
        content: (response?.reply ?? localResponse?.reply ?? "").trim(),
        created_at: new Date().toISOString(),
      };
      if (!assistantMessage.content) throw new Error("MrX returned an empty response.");
      setChatMessages((current) => [...current, assistantMessage].slice(-100));
      if (user && supabase) void storeAssistantMessage(assistantMessage, user.id);
      applyAssistantActions(response?.actions ?? localResponse?.actions ?? []);
    } catch (error) {
      console.error("TimeX could not complete the assistant conversation.", error);
      setChatError(t("assistantChatError"));
    } finally {
      setChatPending(false);
    }
  }

  function applyAssistantActions(actions: AssistantAction[]) {
    for (const action of actions) {
      if (action.type === "note") {
        const title = action.title.trim().slice(0, 100);
        const body = action.body.trim().slice(0, 3000);
        if (!body) continue;
        const note: Note = {
          id: createLocalId(),
          title,
          body,
          updatedAt: Date.now(),
        };
        setData((current) => ({ ...current, notes: [note, ...current.notes] }));
      } else if (action.type === "plan") {
        const goal = action.goal.trim().slice(0, 200);
        const steps = action.steps
          .filter((step) => typeof step === "string" && step.trim())
          .slice(0, 8)
          .map((step) => step.trim().slice(0, 240));
        if (!goal || !steps.length) continue;
        const plan: Plan = {
          id: createLocalId(),
          goal,
          steps,
          createdAt: Date.now(),
        };
        setData((current) => ({ ...current, plans: [plan, ...current.plans] }));
      } else if (action.type === "task") {
        const title = action.title.trim().slice(0, 160);
        if (!title) continue;
        const task: Task = {
          id: createLocalId(),
          title,
          important: false,
          urgent: false,
          completed: false,
          createdAt: Date.now(),
        };
        setData((current) => ({ ...current, tasks: [task, ...current.tasks] }));
      }
    }
  }

  const navItems: { id: Page; icon: string; label: CopyKey }[] = [
    { id: "today", icon: "⌂", label: "today" },
    { id: "calendar", icon: "◷", label: "calendar" },
    { id: "matrix", icon: "▦", label: "matrix" },
    { id: "planner", icon: "✳", label: "planner" },
    { id: "notes", icon: "▤", label: "notes" },
    { id: "assistant", icon: "☷", label: "assistantTab" },
  ];

  function renderTask(task: Task) {
    const quadrant = getQuadrant(task);
    return (
      <li className={`task-row${task.completed ? " task-row-done" : ""}`} key={task.id}>
        <button
          className={`task-check${task.completed ? " checked" : ""}`}
          type="button"
          aria-label={task.completed ? t("markOpen") : t("markDone")}
          onClick={() => toggleTask(task.id)}
        >
          {task.completed ? "✓" : ""}
        </button>
        <span className="task-copy">
          <span className="task-title">{task.title}</span>
          {task.scheduledDate && task.startTime && task.endTime && (
            <span className="task-scheduled-tag">
              <span aria-hidden="true">◷</span>
              {task.scheduledDate !== getLocalDateKey(new Date()) && (
                <span>{new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" }).format(dateFromKey(task.scheduledDate))}</span>
              )}
              {formatCalendarTime(task.startTime)}–{formatCalendarTime(task.endTime)}
            </span>
          )}
          <span className={`priority-tag priority-${quadrant}`}>
            {task.important && task.urgent
              ? `${t("important")} · ${t("urgent")}`
              : task.important
                ? t("important")
                : task.urgent
                  ? t("urgent")
                  : t("unprioritized")}
          </span>
        </span>
        <button
          className="icon-button task-delete"
          type="button"
          aria-label={t("deleteTask")}
          onClick={() => deleteTask(task.id)}
        >
          ×
        </button>
      </li>
    );
  }

  return (
    <div
      className={`app-shell theme-${data.theme}`}
      style={{
        "--user-accent": data.accentColor,
        "--user-accent-ink": getContrastTextColor(data.accentColor),
      } as CSSProperties}
    >
      <aside className="sidebar">
        <a className="brand" href="#today" onClick={() => setPage("today")}>
          <span className="brand-mark">t.</span>
          <span className="brand-name">{t("appName")}</span>
        </a>
        <p className="brand-tagline">{t("tagline")}</p>

        <nav className="main-nav" aria-label={t("appName")}>
          {navItems.map((item) => (
            <button
              className={`nav-item${page === item.id ? " active" : ""}`}
              key={item.id}
              type="button"
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{t(item.label)}</span>
              {item.id === "today" && openTasks.length > 0 && (
                <span className="nav-count">{openTasks.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-motivation">
            <span className="motivation-icon" aria-hidden="true">✦</span>
            <p>{t("pointsHint")}</p>
          </div>
          <div className="profile-row">
            <div className="profile-avatar" aria-hidden="true">{userName ? userName[0].toUpperCase() : "ت"}</div>
            <div>
              <strong>{userName || (isArabic ? "مساحتي" : "My space")}</strong>
              <span>{user?.email || t("savedOnDevice")}</span>
            </div>
            <span className="online-dot" aria-label={t("savedOnDevice")} />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-context">
            <span className="date-dot" />
            <span>{new Intl.DateTimeFormat(lang, { dateStyle: "full" }).format(new Date())}</span>
          </div>
          <div className="topbar-actions">
            <button
              className="subtle-button account-button"
              type="button"
              aria-label={user ? `${t("account")}: ${userName || user.email}` : t("signIn")}
              onClick={() => {
                setAuthError("");
                setAuthNotice("");
                setShowAccount(true);
              }}
            >
              <span aria-hidden="true">{user ? "●" : "♙"}</span>
              <span className="desktop-only">{userName || t("signIn")}</span>
            </button>
            <div className="theme-control">
              <button
                ref={themeButtonRef}
                className="subtle-button theme-button"
                type="button"
                onClick={() => setShowThemePicker((visible) => !visible)}
                aria-label={t("themeSelection")}
                aria-haspopup="true"
                aria-expanded={showThemePicker}
                aria-controls="theme-picker"
                title={t("themeSelection")}
              >
                <span aria-hidden="true">◐</span>
                <span className="desktop-only">{t(themeKey(data.theme))}</span>
              </button>
              {showThemePicker && (
                <section
                  ref={themePickerRef}
                  className="theme-picker"
                  id="theme-picker"
                  role="group"
                  aria-label={t("themeSelection")}
                >
                  <p className="theme-picker-heading">{t("themeSelection")}</p>
                  <div className="theme-options">
                    {themeOrder.map((theme) => (
                      <button
                        className={`theme-option${data.theme === theme ? " selected" : ""}`}
                        key={theme}
                        type="button"
                        aria-pressed={data.theme === theme}
                        onClick={() => setData((current) => ({ ...current, theme }))}
                      >
                        <span className={`theme-swatch theme-swatch-${theme}`} aria-hidden="true" />
                        <span>{t(themeKey(theme))}</span>
                        {data.theme === theme && <span className="theme-option-check" aria-hidden="true">✓</span>}
                      </button>
                    ))}
                  </div>
                  <label className="theme-custom-picker">
                    <span className="theme-custom-label">
                      <span
                        className="theme-swatch theme-swatch-custom"
                        style={{ backgroundColor: data.accentColor }}
                        aria-hidden="true"
                      />
                      <span>{t("themeCustomColor")}</span>
                    </span>
                    <input
                      type="color"
                      value={data.accentColor}
                      aria-label={t("themeCustomColor")}
                      onChange={(event) =>
                        setData((current) => ({
                          ...current,
                          theme: "custom",
                          accentColor: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <p className="theme-picker-hint">{t("themePaletteHint")}</p>
                </section>
              )}
            </div>
            {!appInstalled && (
              <button
                className="subtle-button install-button"
                type="button"
                onClick={() => void installApp()}
                aria-label={t("installApp")}
                title={t("installApp")}
              >
                <span aria-hidden="true">⇩</span>
                <span className="desktop-only">{t("installApp")}</span>
              </button>
            )}
            <button
              className="language-button"
              type="button"
              aria-label={`${t("language")}: ${t("switchLanguage")}`}
              onClick={() =>
                setData((current) => ({
                  ...current,
                  language: current.language === "ar" ? "en" : "ar",
                }))
              }
            >
              <span aria-hidden="true">文</span>
              <span>{t("switchLanguage")}</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          {!workspaceReady ? (
            <div className="workspace-loading" role="status" aria-live="polite">
              <span className="workspace-loading-spinner" aria-hidden="true" />
              <p>{t("loadingWorkspace")}</p>
            </div>
          ) : (
            <>
          {page === "today" && (
            <>
              <section className="welcome-block">
                <div>
                  <span className="eyebrow">{t("todayLabel")}</span>
                  <h1>{greeting}</h1>
                  <p>{t("greetingSub")}</p>
                </div>
                <div className="date-illustration" aria-hidden="true">
                  <span className="sun-orbit">✳</span>
                  <span className="orbit-dot" />
                </div>
              </section>

              <section className="stats-grid" aria-label={t("tasks")}>
                <article className="stat-card">
                  <span className="stat-icon stat-icon-lilac" aria-hidden="true">◷</span>
                  <span className="stat-label">{t("remaining")}</span>
                  <strong className="stat-number">{openTasks.length}</strong>
                </article>
                <article className="stat-card">
                  <span className="stat-icon stat-icon-mint" aria-hidden="true">✓</span>
                  <span className="stat-label">{t("completed")}</span>
                  <strong className="stat-number">{completedCount}</strong>
                </article>
                <article className="stat-card">
                  <span className="stat-icon stat-icon-peach" aria-hidden="true">✦</span>
                  <span className="stat-label">{t("points")}</span>
                  <strong className="stat-number">{data.points}</strong>
                </article>
              </section>

              <div className="dashboard-grid">
                <section className="panel task-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t("tasks")}</h2>
                      <p>{t("tasksSub")}</p>
                    </div>
                    <span className="heading-count">{openTasks.length.toString().padStart(2, "0")}</span>
                  </div>
                  <form className="task-form" onSubmit={submitTask}>
                    <label className="visually-hidden" htmlFor="new-task-title">{t("taskPlaceholder")}</label>
                    <input
                      id="new-task-title"
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder={t("taskPlaceholder")}
                      maxLength={160}
                    />
                    <button className="primary-button add-button" type="submit" disabled={!taskTitle.trim()}>
                      <span aria-hidden="true">＋</span>
                      <span>{t("add")}</span>
                    </button>
                  </form>
                  <button
                    className="task-schedule-toggle"
                    type="button"
                    aria-expanded={taskScheduleOpen}
                    aria-controls="task-schedule-fields"
                    onClick={() => setTaskScheduleOpen((open) => !open)}
                  >
                    <span aria-hidden="true">◷</span>{t("scheduleTask")}
                  </button>
                  {taskScheduleOpen && (
                    <div className="schedule-fields" id="task-schedule-fields">
                      <label>
                        <span>{t("scheduledDate")}</span>
                        <input
                          type="date"
                          value={taskScheduledDate}
                          onChange={(event) => setTaskScheduledDate(event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        <span>{t("startTime")}</span>
                        <input
                          type="time"
                          value={taskStartTime}
                          onChange={(event) => setTaskStartTime(event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        <span>{t("endTime")}</span>
                        <input
                          type="time"
                          value={taskEndTime}
                          onChange={(event) => setTaskEndTime(event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        <span>{t("reminder")}</span>
                        <select
                          value={taskReminder ?? "none"}
                          onChange={(event) =>
                            setTaskReminder(event.target.value === "none" ? null : Number(event.target.value))
                          }
                        >
                          <option value="none">{t("noReminder")}</option>
                          {[5, 10, 15, 30, 60].map((reminder) => (
                            <option value={reminder} key={reminder}>
                              {t("reminderBefore").replace("{minutes}", String(reminder))}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="task-color-field">
                        <span>{t("taskColor")}</span>
                        <input
                          type="color"
                          aria-label={t("chooseTaskColor")}
                          value={taskColor}
                          onChange={(event) => setTaskColor(event.target.value)}
                        />
                      </label>
                    </div>
                  )}
                  <div className="task-options">
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={taskImportant}
                        onChange={(event) => setTaskImportant(event.target.checked)}
                      />
                      <span className="tiny-dot important-dot" />
                      {t("important")}
                    </label>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={taskUrgent}
                        onChange={(event) => setTaskUrgent(event.target.checked)}
                      />
                      <span className="tiny-dot urgent-dot" />
                      {t("urgent")}
                    </label>
                  </div>
                  {data.tasks.length ? (
                    <ul className="task-list">
                      {[...data.tasks]
                        .sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt)
                        .map(renderTask)}
                    </ul>
                  ) : (
                    <div className="empty-state compact-empty">
                      <span className="empty-spark" aria-hidden="true">✳</span>
                      <strong>{t("emptyTasks")}</strong>
                      <p>{t("emptyTasksSub")}</p>
                    </div>
                  )}
                </section>

                <section className="panel focus-panel">
                  <div className="focus-topline">
                    <span className="focus-icon" aria-hidden="true">◷</span>
                    <span className="eyebrow">{t("focus")}</span>
                  </div>
                  <h2>{t("focusSub")}</h2>
                  <div
                    className="timer-face"
                    role="timer"
                    aria-label={`${minutes}:${seconds}`}
                    aria-live="off"
                  >
                    <span>{minutes}</span>
                    <span className="timer-separator">:</span>
                    <span>{seconds}</span>
                  </div>
                  <div className="timer-track" aria-hidden="true">
                    <span style={{ width: `${((25 * 60 - secondsLeft) / (25 * 60)) * 100}%` }} />
                  </div>
                  {secondsLeft === 0 && <p className="timer-finished">{t("sessionDone")}</p>}
                  <div className="timer-controls">
                    <button
                      className="primary-button timer-start"
                      type="button"
                      onClick={() => {
                        if (secondsLeft === 0) setSecondsLeft(25 * 60);
                        setRunning((current) => !current);
                      }}
                    >
                      <span aria-hidden="true">{running ? "Ⅱ" : "▶"}</span>
                      {running
                        ? t("pause")
                        : secondsLeft === 25 * 60 || secondsLeft === 0
                          ? t("start")
                          : t("resume")}
                    </button>
                    <button
                      className="timer-reset"
                      type="button"
                      onClick={() => {
                        setRunning(false);
                        setSecondsLeft(25 * 60);
                      }}
                    >
                      {t("reset")}
                    </button>
                  </div>
                  <div className="focus-decoration focus-decoration-one" aria-hidden="true" />
                  <div className="focus-decoration focus-decoration-two" aria-hidden="true" />
                </section>
              </div>
            </>
          )}

          {page === "calendar" && (
            <section className="content-page calendar-page">
              <header className="page-heading calendar-page-heading">
                <div>
                  <span className="eyebrow">{t("calendar")}</span>
                  <h1>{calendarDateLabel}</h1>
                  <p>{t("calendarIntro")}</p>
                </div>
                <div className="calendar-day-switcher" aria-label={t("calendar")}>
                  <button
                    className="calendar-nav-button"
                    type="button"
                    aria-label={t("previousDay")}
                    onClick={() => setCalendarDay(-1)}
                  >
                    ‹
                  </button>
                  <button
                    className="calendar-today-button"
                    type="button"
                    onClick={() => setCalendarDate(getLocalDateKey(new Date()))}
                  >
                    {t("todayButton")}
                  </button>
                  <button
                    className="calendar-nav-button"
                    type="button"
                    aria-label={t("nextDay")}
                    onClick={() => setCalendarDay(1)}
                  >
                    ›
                  </button>
                </div>
              </header>

              <section className="panel calendar-add-panel">
                <div className="calendar-add-heading">
                  <div>
                    <span className="calendar-add-icon" aria-hidden="true">＋</span>
                    <h2>{t("addScheduledTask")}</h2>
                  </div>
                  <span>{calendarDateLabel}</span>
                </div>
                <form className="calendar-add-form" onSubmit={submitCalendarTask}>
                  <label className="visually-hidden" htmlFor="calendar-task-title">
                    {t("scheduledTaskPlaceholder")}
                  </label>
                  <input
                    id="calendar-task-title"
                    value={calendarTaskTitle}
                    onChange={(event) => setCalendarTaskTitle(event.target.value)}
                    placeholder={t("scheduledTaskPlaceholder")}
                    maxLength={160}
                    required
                  />
                  <div className="calendar-add-times">
                    <label>
                      <span>{t("startTime")}</span>
                      <input
                        type="time"
                        value={calendarStartTime}
                        onChange={(event) => setCalendarStartTime(event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      <span>{t("endTime")}</span>
                      <input
                        type="time"
                        value={calendarEndTime}
                        onChange={(event) => setCalendarEndTime(event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      <span>{t("reminder")}</span>
                      <select
                        value={calendarReminder ?? "none"}
                        onChange={(event) =>
                          setCalendarReminder(event.target.value === "none" ? null : Number(event.target.value))
                        }
                      >
                        <option value="none">{t("noReminder")}</option>
                        {[5, 10, 15, 30, 60].map((reminder) => (
                          <option value={reminder} key={reminder}>
                            {t("reminderBefore").replace("{minutes}", String(reminder))}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="task-color-field">
                      <span>{t("taskColor")}</span>
                      <input
                        type="color"
                        aria-label={t("chooseTaskColor")}
                        value={calendarTaskColor}
                        onChange={(event) => setCalendarTaskColor(event.target.value)}
                      />
                    </label>
                    <button
                      className="primary-button calendar-add-button"
                      type="submit"
                      disabled={!calendarTaskTitle.trim()}
                    >
                      <span aria-hidden="true">＋</span>{t("addScheduledTask")}
                    </button>
                  </div>
                </form>
                {unscheduledCount > 0 && (
                  <p className="calendar-unscheduled-note">
                    {t("unscheduledCount").replace("{count}", String(unscheduledCount))}
                  </p>
                )}
                <p className="calendar-unscheduled-note">{t("reminderBackgroundHint")}</p>
              </section>

              <section className="panel calendar-panel">
                <header className="calendar-panel-heading">
                  <div>
                    <h2>{t("calendarTasks")}</h2>
                    <p>{calendarDateLabel}</p>
                  </div>
                  <span className="heading-count">
                    {calendarTasks.length.toString().padStart(2, "0")}
                  </span>
                </header>
                <div className="calendar-scroll">
                  <div className="calendar-time-grid">
                    <div className="calendar-hours" aria-hidden="true">
                      {Array.from({ length: 24 }, (_, hour) => (
                        <span key={hour}>{formatHour(hour)}</span>
                      ))}
                    </div>
                    <div className="calendar-day-track">
                      {Array.from({ length: 24 }, (_, hour) => (
                        <span
                          className="calendar-hour-line"
                          key={hour}
                          style={{ top: `${hour * 64}px` }}
                          aria-hidden="true"
                        />
                      ))}
                      {calendarLayout.map(({ task, column, columns, startMinutes, durationMinutes }) => {
                        const quadrant = getQuadrant(task);
                        const columnWidth = 100 / columns;
                        return (
                          <article
                            className={`calendar-event${task.completed ? " calendar-event-complete" : ""}`}
                            key={task.id}
                            style={{
                              "--event-color": task.color ?? "#6a9cff",
                              top: `${startMinutes * (64 / 60)}px`,
                              height: `${Math.max(32, durationMinutes * (64 / 60))}px`,
                              insetInlineStart: `calc(${column * columnWidth}% + 5px)`,
                              width: `calc(${columnWidth}% - 10px)`,
                            } as CSSProperties}
                          >
                            <button
                              className={`calendar-event-check${task.completed ? " checked" : ""}`}
                              type="button"
                              aria-label={task.completed ? t("markOpen") : t("markDone")}
                              onClick={() => toggleTask(task.id)}
                            >
                              {task.completed ? "✓" : ""}
                            </button>
                            <div className="calendar-event-copy">
                              <strong>{task.title}</strong>
                              <span>{formatCalendarTime(task.startTime)} – {formatCalendarTime(task.endTime)}</span>
                              <select
                                className="calendar-event-reminder-select"
                                aria-label={`${t("reminder")} — ${task.title}`}
                                value={task.reminderMinutes ?? "none"}
                                onChange={(event) =>
                                  void updateTaskReminder(
                                    task.id,
                                    event.target.value === "none" ? null : Number(event.target.value),
                                  )
                                }
                              >
                                <option value="none">{t("noReminder")}</option>
                                {[5, 10, 15, 30, 60].map((reminder) => (
                                  <option value={reminder} key={reminder}>
                                    {t("reminderBefore").replace("{minutes}", String(reminder))}
                                  </option>
                                ))}
                              </select>
                              <span className={`priority-tag priority-${quadrant}`}>
                                {task.important && task.urgent
                                  ? `${t("important")} · ${t("urgent")}`
                                  : task.important
                                    ? t("important")
                                    : task.urgent
                                      ? t("urgent")
                                      : t("unprioritized")}
                              </span>
                            </div>
                            <div className="calendar-event-actions">
                              <input
                                className="calendar-event-color"
                                type="color"
                                aria-label={`${t("chooseTaskColor")} — ${task.title}`}
                                value={task.color ?? "#6a9cff"}
                                onChange={(event) => updateTaskColor(task.id, event.target.value)}
                              />
                              <button
                                className="icon-button calendar-event-delete"
                                type="button"
                                aria-label={t("deleteTask")}
                                onClick={() => deleteTask(task.id)}
                              >
                                ×
                              </button>
                            </div>
                          </article>
                        );
                      })}
                      {calendarTasks.length === 0 && (
                        <div className="empty-state calendar-empty">
                          <span className="empty-spark" aria-hidden="true">◷</span>
                          <strong>{t("calendarEmpty")}</strong>
                          <p>{t("calendarEmptySub")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <nav className="calendar-week-strip" aria-label={t("weekOverview")}>
                  {calendarWeek.map((dateKey) => {
                    const date = dateFromKey(dateKey);
                    const tasksForDate = data.tasks.filter((task) => task.scheduledDate === dateKey);
                    const fullDate = new Intl.DateTimeFormat(lang, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }).format(date);
                    return (
                      <button
                        className={`calendar-week-day${dateKey === calendarDate ? " selected" : ""}`}
                        type="button"
                        key={dateKey}
                        aria-label={fullDate}
                        aria-pressed={dateKey === calendarDate}
                        onClick={() => setCalendarDate(dateKey)}
                      >
                        <span className="calendar-week-weekday">
                          {new Intl.DateTimeFormat(lang, { weekday: "short" }).format(date)}
                        </span>
                        <strong>{date.getDate()}</strong>
                        <span className="calendar-week-markers" aria-hidden="true">
                          {tasksForDate.slice(0, 3).map((task) => (
                            <i key={task.id} style={{ backgroundColor: task.color ?? "var(--accent)" }} />
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </section>
            </section>
          )}

          {page === "matrix" && (
            <section className="content-page">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">{t("matrix")}</span>
                  <h1>{t("priorities")}</h1>
                  <p>{t("matrixIntro")}</p>
                </div>
              </div>
              <div className="matrix-grid">
                {[
                  { title: "doNow", hint: "doNowHint", quadrant: 0, tone: "coral" },
                  { title: "schedule", hint: "scheduleHint", quadrant: 1, tone: "violet" },
                  { title: "delegate", hint: "delegateHint", quadrant: 2, tone: "amber" },
                  { title: "eliminate", hint: "eliminateHint", quadrant: 3, tone: "blue" },
                ].map((item, index) => {
                  const quadrantTasks = openTasks.filter((task) => getQuadrant(task) === item.quadrant);
                  return (
                    <article className={`matrix-card matrix-${item.tone}`} key={item.title}>
                      <header>
                        <div className="matrix-card-title">
                          <span className="matrix-number">0{index + 1}</span>
                          <div>
                            <h2>{t(item.title as CopyKey)}</h2>
                            <p>{t(item.hint as CopyKey)}</p>
                          </div>
                        </div>
                        <span className="matrix-count">{quadrantTasks.length}</span>
                      </header>
                      {quadrantTasks.length ? (
                        <ul className="task-list matrix-task-list">{quadrantTasks.map(renderTask)}</ul>
                      ) : (
                        <p className="matrix-empty">{t("allCaughtUp")}</p>
                      )}
                    </article>
                  );
                })}
              </div>
              <form
                className="matrix-quick-add"
                onSubmit={(event) => {
                  event.preventDefault();
                  addTask(matrixTaskTitle);
                  setMatrixTaskTitle("");
                }}
              >
                <span className="quick-add-mark" aria-hidden="true">＋</span>
                <div>
                  <strong>{t("addTask")}</strong>
                  <label className="visually-hidden" htmlFor="matrix-add-task">{t("taskPlaceholder")}</label>
                  <input
                    id="matrix-add-task"
                    className="matrix-quick-input"
                    value={matrixTaskTitle}
                    onChange={(event) => setMatrixTaskTitle(event.target.value)}
                    placeholder={t("taskPlaceholder")}
                    maxLength={160}
                  />
                </div>
                <button className="primary-button" type="submit" disabled={!matrixTaskTitle.trim()}>
                  {t("add")}
                </button>
              </form>
            </section>
          )}

          {page === "notes" && (
            <section className="content-page">
              <div className="page-heading page-heading-action">
                <div>
                  <span className="eyebrow">{t("notes")}</span>
                  <h1>{t("notesIntro")}</h1>
                  <p>{t("saveNoteHint")}</p>
                </div>
                <button className="primary-button" type="button" onClick={createNote}>
                  <span aria-hidden="true">＋</span>{t("newNote")}
                </button>
              </div>
              {data.notes.length ? (
                <div className="notes-grid">
                  {data.notes.map((note, index) => (
                    <article className={`note-card note-card-${index % 3}`} key={note.id}>
                      <div className="note-card-top">
                        <span className="note-mark" aria-hidden="true">✳</span>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={t("deleteNote")}
                          onClick={() =>
                            setData((current) => ({
                              ...current,
                              notes: current.notes.filter((item) => item.id !== note.id),
                            }))
                          }
                        >
                          ×
                        </button>
                      </div>
                      <label className="visually-hidden" htmlFor={`note-title-${note.id}`}>{t("noteTitle")}</label>
                      <input
                        id={`note-title-${note.id}`}
                        className="note-title-input"
                        value={note.title}
                        placeholder={t("noteTitle")}
                        maxLength={100}
                        onChange={(event) => updateNote(note.id, { title: event.target.value })}
                      />
                      <label className="visually-hidden" htmlFor={`note-body-${note.id}`}>{t("noteBody")}</label>
                      <textarea
                        id={`note-body-${note.id}`}
                        value={note.body}
                        placeholder={t("noteBody")}
                        maxLength={3000}
                        onChange={(event) => updateNote(note.id, { body: event.target.value })}
                      />
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state page-empty">
                  <span className="empty-spark" aria-hidden="true">▤</span>
                  <strong>{t("noteEmpty")}</strong>
                  <button className="text-button" type="button" onClick={createNote}>{t("newNote")} ＋</button>
                </div>
              )}
            </section>
          )}

          {page === "planner" && (
            <section className="content-page planner-page">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">{t("planner")}</span>
                  <h1>{t("plannerIntro")}</h1>
                </div>
              </div>
              <div className="planner-layout">
                <section className="panel planner-panel">
                  <div className="planner-icon" aria-hidden="true">✳</div>
                  <span className="eyebrow">{t("planner")}</span>
                  <form onSubmit={buildPlan}>
                    <label htmlFor="goal-input">{t("goalLabel")}</label>
                    <textarea
                      id="goal-input"
                      value={goal}
                      onChange={(event) => setGoal(event.target.value)}
                      placeholder={t("goalPlaceholder")}
                      maxLength={200}
                      required
                    />
                    <button className="primary-button" type="submit" disabled={!goal.trim()}>
                      {t("makePlan")} <span aria-hidden="true">↗</span>
                    </button>
                  </form>
                  <div className="assistant-disclosure">
                    <span aria-hidden="true">ⓘ</span>
                    <p>{t("assistantNote")}</p>
                  </div>
                </section>
                <section className="plans-column">
                  <h2>{t("pastPlans")}</h2>
                  {data.plans.length ? (
                    data.plans.map((plan) => (
                      <article className="plan-card" key={plan.id}>
                        <div className="plan-card-heading">
                          <span className="plan-bullet" aria-hidden="true">✳</span>
                          <h3>{plan.goal}</h3>
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={t("deletePlan")}
                            onClick={() =>
                              setData((current) => ({
                                ...current,
                                plans: current.plans.filter((item) => item.id !== plan.id),
                              }))
                            }
                          >
                            ×
                          </button>
                        </div>
                        <p className="plan-steps-label">{t("planSteps")}</p>
                        <ol className="plan-steps">
                          {plan.steps.map((step, index) => (
                            <li key={`${plan.id}-${index}`}>
                              <span className="step-number">{index + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                        <button className="text-button plan-add-button" type="button" onClick={() => addPlanToTasks(plan)}>
                          <span aria-hidden="true">＋</span>{t("addPlanTasks")}
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="empty-state plan-empty">
                      <span className="empty-spark" aria-hidden="true">✳</span>
                      <p>{t("noPlans")}</p>
                    </div>
                  )}
                </section>
              </div>
            </section>
          )}

          {page === "assistant" && (
            <section className="content-page assistant-page">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">{t("assistantChat")}</span>
                  <h1>{userName ? t("welcomeWithName").replace("{name}", userName) : t("assistantChat")}</h1>
                  <p>{t("assistantChatSub")}</p>
                </div>
                {user && (
                  <span className="workspace-badge">
                    <span aria-hidden="true">◉</span>{t("cloudWorkspace")}
                  </span>
                )}
              </div>
              <section className="chat-panel">
                <div className="chat-header">
                  <span className="chat-avatar" aria-hidden="true">✳</span>
                  <div>
                    <h2>{t("assistantChat")}</h2>
                    <p>{user ? user.email : t("localAssistantLabel")}</p>
                  </div>
                  <span className={`chat-connection${supabase && user ? " connected" : ""}`}>
                    {supabase && user ? t("cloudWorkspace") : t("localAssistantLabel")}
                  </span>
                </div>
                <div className="chat-privacy">
                  <span aria-hidden="true">⌑</span>
                  <p>{t("assistantPrivacy")}</p>
                </div>
                <div className="chat-transcript" aria-live="polite">
                  {chatMessages.length === 0 && (
                    <article className="chat-message assistant-message">
                      <span className="message-avatar" aria-hidden="true">✳</span>
                      <p>{t("greetingName").replace("{name}", userName || (isArabic ? "صديقي" : "friend"))}</p>
                    </article>
                  )}
                  {chatMessages.map((message) => (
                    <article
                      className={`chat-message ${message.role === "user" ? "user-message" : "assistant-message"}`}
                      key={message.id}
                    >
                      {message.role === "assistant" && (
                        <span className="message-avatar" aria-hidden="true">✳</span>
                      )}
                      <p>{message.content}</p>
                    </article>
                  ))}
                  {chatPending && (
                    <div className="chat-typing" role="status">
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                {chatError && <p className="chat-error" role="alert">{chatError}</p>}
                {(!supabase || !user) && (
                  <div className="chat-access-notice">
                    <span aria-hidden="true">ⓘ</span>
                    <p>{t("mrxLocalMode")}</p>
                    {supabase && !user && (
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => {
                          setAuthError("");
                          setAuthNotice("");
                          setShowAccount(true);
                        }}
                      >
                        {t("signIn")}
                      </button>
                    )}
                  </div>
                )}
                {chatNotice && <p className="auth-feedback" role="status">{chatNotice}</p>}
                <form className="chat-compose" onSubmit={sendAssistantMessage}>
                  <label className="visually-hidden" htmlFor="assistant-message">{t("assistantChatPlaceholder")}</label>
                  <input
                    id="assistant-message"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder={t("assistantChatPlaceholder")}
                    maxLength={4000}
                    disabled={chatPending}
                  />
                  <button
                    className="primary-button chat-send"
                    type="submit"
                    aria-label={t("sendMessage")}
                    disabled={chatPending || !chatInput.trim()}
                  >
                    <span aria-hidden="true">➤</span>
                  </button>
                </form>
              </section>
            </section>
          )}
            </>
          )}
        </div>
        <footer className="app-footer">Created by MrX OSA</footer>
      </main>

      <nav className="mobile-nav" aria-label={t("appName")}>
        {navItems.map((item) => (
          <button
            className={`mobile-nav-item${page === item.id ? " active" : ""}`}
            key={item.id}
            type="button"
            aria-current={page === item.id ? "page" : undefined}
            onClick={() => setPage(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{t(item.label)}</span>
          </button>
        ))}
      </nav>

      {showInstallHelp && (
        <div
          className="install-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowInstallHelp(false);
          }}
        >
          <section
            className="install-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-modal-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") setShowInstallHelp(false);
            }}
          >
            <button
              ref={installCloseRef}
              className="icon-button install-modal-close"
              type="button"
              aria-label={t("close")}
              onClick={() => setShowInstallHelp(false)}
            >
              ×
            </button>
            <span className="install-modal-icon" aria-hidden="true">t.</span>
            <h2 id="install-modal-title">{t("installTitle")}</h2>
            <p>{t("installHelp")}</p>
            <ul>
              <li>{t("installDesktop")}</li>
              <li>{t("installAndroid")}</li>
              <li>{t("installApple")}</li>
            </ul>
            <button
              className="primary-button install-modal-done"
              type="button"
              onClick={() => setShowInstallHelp(false)}
            >
              {t("close")}
            </button>
          </section>
        </div>
      )}

      {showAccount && (
        <div
          className="install-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !authPending) setShowAccount(false);
          }}
        >
          <section
            className="install-modal account-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !authPending) setShowAccount(false);
            }}
          >
            <button
              ref={authCloseRef}
              className="icon-button install-modal-close"
              type="button"
              aria-label={t("close")}
              disabled={authPending}
              onClick={() => setShowAccount(false)}
            >
              ×
            </button>
            <span className="install-modal-icon" aria-hidden="true">{userName ? userName[0].toUpperCase() : "t."}</span>
            <h2 id="account-modal-title">{user ? (userName || t("accountStatus")) : t("account")}</h2>
            {user ? (
              <div className="account-profile">
                <p>{user.email}</p>
                <p>{t("accountHelp")}</p>
                <button className="primary-button install-modal-done" type="button" disabled={authPending} onClick={() => void signOut()}>
                  {authPending ? "…" : t("signOut")}
                </button>
              </div>
            ) : cloudConfigurationMissing ? (
              <>
                <p>{t("accountNotConfigured")}</p>
                <a
                  className="cloud-setup-link"
                  href="https://github.com/MrX16963/TimeX#accounts-database-and-chat"
                  target="_blank"
                  rel="noreferrer"
                >
                  {isArabic ? "إعداد قاعدة البيانات والمصادقة" : "Database and sign-in setup"}
                </a>
              </>
            ) : (
              <>
                <p>{t("accountHelp")}</p>
                <div className="auth-mode-switch">
                  <button
                    type="button"
                    className={authMode === "sign-in" ? "selected" : ""}
                    onClick={() => {
                      setAuthMode("sign-in");
                      setAuthError("");
                      setAuthNotice("");
                    }}
                  >
                    {t("signIn")}
                  </button>
                  <button
                    type="button"
                    className={authMode === "sign-up" ? "selected" : ""}
                    onClick={() => {
                      setAuthMode("sign-up");
                      setAuthError("");
                      setAuthNotice("");
                    }}
                  >
                    {t("createAccount")}
                  </button>
                </div>
                <form className="auth-form" onSubmit={submitAuth}>
                  {authMode === "sign-up" && (
                    <>
                      <label htmlFor="account-display-name">{t("displayName")}</label>
                      <input
                        id="account-display-name"
                        autoComplete="name"
                        value={authName}
                        onChange={(event) => setAuthName(event.target.value)}
                        maxLength={100}
                        required
                      />
                    </>
                  )}
                  <label htmlFor="account-email">{t("email")}</label>
                  <input
                    id="account-email"
                    type="email"
                    autoComplete="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    maxLength={254}
                    required
                  />
                  <label htmlFor="account-password">{t("password")}</label>
                  <input
                    id="account-password"
                    type="password"
                    autoComplete={authMode === "sign-up" ? "new-password" : "current-password"}
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    minLength={6}
                    maxLength={72}
                    required
                  />
                  {authError && <p className="auth-feedback auth-error" role="alert">{authError}</p>}
                  {authNotice && <p className="auth-feedback" role="status">{authNotice}</p>}
                  <button className="primary-button auth-submit" type="submit" disabled={authPending}>
                    {authPending ? "…" : authMode === "sign-up" ? t("createAccount") : t("signIn")}
                  </button>
                </form>
                <div className="auth-provider-divider"><span>{isArabic ? "أو" : "or"}</span></div>
                <div className="auth-provider-buttons">
                  <button className="auth-provider" type="button" disabled={authPending} onClick={() => void signInWithProvider("google")}>
                    <span aria-hidden="true">G</span>{t("continueGoogle")}
                  </button>
                  <button className="auth-provider" type="button" disabled={authPending} onClick={() => void signInWithProvider("facebook")}>
                    <span aria-hidden="true">f</span>{t("continueFacebook")}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {storageFailed && (
        <div className="storage-alert" role="alert">
          <span>{t("storageWarning")}</span>
          <button type="button" aria-label={t("dismiss")} onClick={() => setStorageFailed(false)}>×</button>
        </div>
      )}
      {cloudSyncFailed && (
        <div className="storage-alert" role="alert">
          <span>{t("cloudSyncError")}</span>
          <button type="button" aria-label={t("dismiss")} onClick={() => setCloudSyncFailed(false)}>×</button>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

const themeLabels: Record<Theme, CopyKey> = {
  light: "themeLight",
  midnight: "themeMidnight",
  sage: "themeSage",
  lavender: "themeLavender",
  custom: "themeCustom",
};

function themeKey(theme: Theme): CopyKey {
  return themeLabels[theme];
}

export default App;
