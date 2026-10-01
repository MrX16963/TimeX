import { useEffect, useMemo, useState, type FormEvent } from "react";
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
    assistantNote: "This guided helper runs locally using a planning template. It is not connected to an AI service, and your goal stays on this device.",
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
    assistantNote: "يساعدك هذا المخطّط بإرشادات جاهزة تعمل على جهازك. لا يتصل بخدمة ذكاء اصطناعي، ويبقى هدفك على هذا الجهاز.",
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
} satisfies Record<keyof typeof englishCopy, string>;

const copy = {
  en: englishCopy,
  ar: arabicCopy,
} satisfies Record<Language, Record<string, string>>;

type CopyKey = keyof typeof copy.en;
type Page = "today" | "matrix" | "notes" | "planner";

const themeOrder: Theme[] = ["light", "midnight", "sage", "lavender"];

function makeId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadData(): AppData {
  try {
    return readAppData(window.localStorage.getItem("timex-data"));
  } catch {
    return DEFAULT_DATA;
  }
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
  const lang = data.language;
  const isArabic = lang === "ar";
  const t = (key: CopyKey) => copy[lang][key];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [isArabic, lang]);

  useEffect(() => {
    try {
      window.localStorage.setItem("timex-data", JSON.stringify(data));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }, [data]);

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

  const navItems: { id: Page; icon: string; label: CopyKey }[] = [
    { id: "today", icon: "⌂", label: "today" },
    { id: "matrix", icon: "▦", label: "matrix" },
    { id: "planner", icon: "✳", label: "planner" },
    { id: "notes", icon: "▤", label: "notes" },
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
            <div className="profile-avatar" aria-hidden="true">ت</div>
            <div>
              <strong>{isArabic ? "مساحتي" : "My space"}</strong>
              <span>{t("savedOnDevice")}</span>
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
              className="subtle-button theme-button"
              type="button"
              onClick={cycleTheme}
              aria-label={`${t("theme")}: ${t(themeKey(data.theme))}`}
              title={`${t("theme")}: ${t(themeKey(data.theme))}`}
            >
              <span aria-hidden="true">◐</span>
              <span className="desktop-only">{t(themeKey(data.theme))}</span>
            </button>
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
          {page === "today" && (
            <>
              <section className="welcome-block">
                <div>
                  <span className="eyebrow">{t("todayLabel")}</span>
                  <h1>{t("greeting")}</h1>
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
        </div>
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

      {storageFailed && (
        <div className="storage-alert" role="alert">
          <span>{t("storageWarning")}</span>
          <button type="button" aria-label={t("dismiss")} onClick={() => setStorageFailed(false)}>×</button>
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
