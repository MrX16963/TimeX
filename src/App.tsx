import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
  getQuadrant,
  readAppData,
  type AppData,
  type Language,
  type Note,
  type Plan,
  type Task,
  type Theme,
} from "./lib";

const englishCopy = {
    appName: "TimeX",
    tagline: "Make room for what matters.",
    today: "Today",
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
    assistantNote: "This planner creates a simple five-step plan on your device. For a personalized, interactive AI chat, sign in and configure a provider.",
    planSteps: "A gentle place to start",
    addPlanTasks: "Add steps to my tasks",
    planAdded: "Steps added to your task list.",
    pastPlans: "Your plans",
    noPlans: "Your plans will appear here when you create one.",
    theme: "Change theme",
    themeLight: "Soft light",
    themeMidnight: "Midnight",
    themeSage: "Quiet sage",
    themeLavender: "Lavender",
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
    accountNotConfigured: "Online accounts are not configured for this app yet. The owner needs to connect a Supabase project before sign-in is available.",
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
    greetingName: "Hello, {name}. I'm your TimeX planning companion.",
    assistantChat: "Your planning companion",
    assistantTab: "Assistant",
    assistantChatSub: "Talk through an idea, shape a plan, or ask me to remember a note.",
    assistantChatPlaceholder: "What would you like to talk through?",
    sendMessage: "Send message",
    signInForChat: "Sign in to start a private conversation with your planning assistant.",
    configureForChat: "Chat needs a connected TimeX account and a configured AI provider. Your notes and plans remain available here.",
    assistantChatError: "I couldn't reach the planning assistant. Check its server configuration and try again.",
    chatSavingError: "Your workspace is saved, but a chat message couldn't be synced.",
    cloudSyncError: "Cloud sync is temporarily unavailable. Your changes are saved on this device.",
    accountStatus: "Your account",
    localWorkspace: "Local workspace",
    cloudWorkspace: "Private cloud workspace",
    loadingWorkspace: "Loading your private workspace…",
    authenticationRequired: "Create an account or sign in to sync your own workspace across devices.",
    signInSuccessful: "Welcome back.",
    assistantPrivacy: "When accounts are enabled, your private workspace and chat history are saved to your account. Messages sent to chat are processed by the configured AI provider.",
};

const arabicCopy = {
    appName: "TimeX",
    tagline: "اترك مساحة لما يهمك.",
    today: "اليوم",
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
    assistantNote: "ينشئ هذا المخطّط خطة بسيطة من خمس خطوات على جهازك. للمحادثة مع مساعد ذكاء اصطناعي باسمك، سجّل الدخول ثم أعد إعداد المزوّد.",
    planSteps: "خطوة هادئة للبدء",
    addPlanTasks: "أضف الخطوات إلى مهامي",
    planAdded: "أُضيفت الخطوات إلى مهامك.",
    pastPlans: "خططي",
    noPlans: "ستظهر خططك هنا بعد إنشاء أول خطة.",
    theme: "تغيير المظهر",
    themeLight: "ضوء هادئ",
    themeMidnight: "منتصف الليل",
    themeSage: "أخضر هادئ",
    themeLavender: "لافندر",
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
    accountNotConfigured: "لم يتم إعداد الحسابات عبر الإنترنت بعد. يحتاج مالك التطبيق إلى ربط مشروع Supabase لتفعيل تسجيل الدخول.",
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
    greetingName: "مرحبًا {name}. أنا مساعدك للتخطيط في TimeX.",
    assistantChat: "مساعدك للتخطيط",
    assistantTab: "المساعد",
    assistantChatSub: "ناقش فكرة، ابنِ خطة، أو اطلب مني تدوين ملاحظة.",
    assistantChatPlaceholder: "ما الموضوع الذي ترغب في مناقشته؟",
    sendMessage: "إرسال الرسالة",
    signInForChat: "سجّل الدخول لبدء محادثة خاصة مع مساعد التخطيط.",
    configureForChat: "تتطلب المحادثة حساب TimeX وربط مزوّد ذكاء اصطناعي. يمكنك استخدام ملاحظاتك وخططك هنا.",
    assistantChatError: "تعذّر الاتصال بمساعد التخطيط. تحقق من إعداد الخادم ثم حاول مجددًا.",
    chatSavingError: "حُفظت مساحتك، لكن تعذّرت مزامنة رسالة من المحادثة.",
    cloudSyncError: "المزامنة السحابية غير متاحة مؤقتًا. حُفظت تغييراتك على هذا الجهاز.",
    accountStatus: "حسابك",
    localWorkspace: "مساحة محلية",
    cloudWorkspace: "مساحة سحابية خاصة",
    loadingWorkspace: "جارٍ تحميل مساحتك الخاصة…",
    authenticationRequired: "أنشئ حسابًا أو سجّل الدخول لمزامنة مساحتك الخاصة بين الأجهزة.",
    signInSuccessful: "أهلًا بعودتك.",
    assistantPrivacy: "عند تفعيل الحسابات، تُحفظ محادثتك ومساحة عملك في حسابك الخاص. يعالج مزوّد الذكاء الاصطناعي المُعدّ الرسائل التي ترسلها إليه.",
} satisfies Record<keyof typeof englishCopy, string>;

const copy = {
  en: englishCopy,
  ar: arabicCopy,
} satisfies Record<Language, Record<string, string>>;

type CopyKey = keyof typeof copy.en;
type Page = "today" | "matrix" | "notes" | "planner" | "assistant";
type AuthMode = "sign-in" | "sign-up";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const themeOrder: Theme[] = ["light", "midnight", "sage", "lavender"];

function makeId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  const [page, setPage] = useState<Page>("today");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskImportant, setTaskImportant] = useState(false);
  const [taskUrgent, setTaskUrgent] = useState(false);
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
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [appInstalled, setAppInstalled] = useState(() =>
    Capacitor.isNativePlatform() ||
    window.timexExternal !== undefined ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const installCloseRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [isArabic, lang]);

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

  const openTasks = useMemo(
    () => data.tasks.filter((task) => !task.completed),
    [data.tasks],
  );
  const completedCount = data.tasks.filter((task) => task.completed).length;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function addTask(title: string, important = false, urgent = false) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task: Task = {
      id: makeId(),
      title: trimmed,
      important,
      urgent,
      completed: false,
      createdAt: Date.now(),
    };
    setData((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    notify(t("taskAdded"));
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTask(taskTitle, taskImportant, taskUrgent);
    setTaskTitle("");
    setTaskImportant(false);
    setTaskUrgent(false);
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

  function cycleTheme() {
    const currentIndex = themeOrder.indexOf(data.theme);
    setData((current) => ({
      ...current,
      theme: themeOrder[(currentIndex + 1) % themeOrder.length],
    }));
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
    if (!content || !user || !supabase || chatPending) return;

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
    setChatPending(true);
    void storeAssistantMessage(userMessage, user.id);

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

      const assistantMessage: ChatMessage = {
        id: createLocalId(),
        role: "assistant",
        content: data.reply.trim(),
        created_at: new Date().toISOString(),
      };
      setChatMessages((current) => [...current, assistantMessage].slice(-100));
      void storeAssistantMessage(assistantMessage, user.id);
      applyAssistantActions(data.actions);
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
      }
    }
  }

  const navItems: { id: Page; icon: string; label: CopyKey }[] = [
    { id: "today", icon: "⌂", label: "today" },
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
    <div className={`app-shell theme-${data.theme}`}>
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
            <button
              className="subtle-button theme-button"
              type="button"
              onClick={cycleTheme}
              aria-label={`${t("theme")}: ${t(themeKey(data.theme))}`}
              title={`${t("theme")}: ${t(themeKey(data.theme))}`}
            >
              <span aria-hidden="true">◐</span>
              <span className="desktop-only">{t(themeKey(data.theme))}</span>
            </button>
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
                    <p>{user ? user.email : t("localWorkspace")}</p>
                  </div>
                  <span className={`chat-connection${supabase && user ? " connected" : ""}`}>
                    {supabase && user ? t("cloudWorkspace") : t("localWorkspace")}
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
                {!user && (
                  <div className="chat-access-notice">
                    <span aria-hidden="true">ⓘ</span>
                    <p>{cloudConfigurationMissing ? t("configureForChat") : t("signInForChat")}</p>
                    {!cloudConfigurationMissing && (
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
                <form className="chat-compose" onSubmit={sendAssistantMessage}>
                  <label className="visually-hidden" htmlFor="assistant-message">{t("assistantChatPlaceholder")}</label>
                  <input
                    id="assistant-message"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder={t("assistantChatPlaceholder")}
                    maxLength={4000}
                    disabled={!supabase || !user || chatPending}
                  />
                  <button
                    className="primary-button chat-send"
                    type="submit"
                    aria-label={t("sendMessage")}
                    disabled={!supabase || !user || chatPending || !chatInput.trim()}
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
};

function themeKey(theme: Theme): CopyKey {
  return themeLabels[theme];
}

export default App;
