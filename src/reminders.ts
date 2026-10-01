import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Language, Task } from "./lib";

export type ReminderPermission = "granted" | "denied" | "unsupported";
type RemindableTask = Pick<
  Task,
  "id" | "title" | "completed" | "scheduledDate" | "startTime" | "reminderMinutes" | "reminderSentAt"
>;

const notificationChannelId = "timex-task-reminders";
const browserTimerLimit = 2_147_000_000;

export function getReminderTime(task: RemindableTask): Date | null {
  if (!task.scheduledDate || !task.startTime || task.reminderMinutes == null) return null;
  const [year, month, day] = task.scheduledDate.split("-").map(Number);
  const [hours, minutes] = task.startTime.split(":").map(Number);
  const reminderTime = new Date(year, month - 1, day, hours, minutes);
  reminderTime.setMinutes(reminderTime.getMinutes() - task.reminderMinutes);
  return Number.isNaN(reminderTime.valueOf()) ? null : reminderTime;
}

export function notificationIdForTask(taskId: string): number {
  let hash = 2_166_136_261;
  for (const character of taskId) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619);
  }
  return (hash >>> 0) & 0x7fffffff || 1;
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (Capacitor.isNativePlatform()) {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display === "granted") return "granted";
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === "granted" ? "granted" : "denied";
  }

  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return (await Notification.requestPermission()) === "granted" ? "granted" : "denied";
}

export async function syncNativeReminders(
  tasks: RemindableTask[],
  language: Language,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") return;

  if (Capacitor.getPlatform() === "android") {
    await LocalNotifications.createChannel({
      id: notificationChannelId,
      name: language === "ar" ? "تذكيرات المهام" : "Task reminders",
      description: language === "ar" ? "تنبيهات مواعيد مهامك" : "Alerts for scheduled tasks",
      importance: 5,
    });
  }

  const pending = await LocalNotifications.getPending();
  const appNotifications = pending.notifications.filter(
    (notification) => typeof notification.extra?.timexTaskId === "string",
  );
  if (appNotifications.length) {
    await LocalNotifications.cancel({
      notifications: appNotifications.map(({ id }) => ({ id })),
    });
  }

  const now = Date.now();
  const notifications = tasks
    .filter((task) => !task.completed && task.reminderSentAt === undefined)
    .flatMap((task) => {
      const at = getReminderTime(task);
      if (!at || at.getTime() <= now) return [];
      return [{
        id: notificationIdForTask(task.id),
        title: language === "ar" ? "تذكير من TimeX" : "TimeX reminder",
        body: language === "ar"
          ? `حان وقت مهمتك: ${task.title}`
          : `It's time for: ${task.title}`,
        schedule: { at, allowWhileIdle: true },
        channelId: notificationChannelId,
        extra: { timexTaskId: task.id },
      }];
    });

  if (notifications.length) await LocalNotifications.schedule({ notifications });
}

export function scheduleBrowserReminders(
  tasks: RemindableTask[],
  language: Language,
  onReminder: (taskId: string) => void,
): () => void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return () => undefined;
  }

  const timers: number[] = [];
  for (const task of tasks) {
    if (task.completed || task.reminderSentAt !== undefined) continue;
    const reminderTime = getReminderTime(task);
    if (!reminderTime) continue;

    const schedule = () => {
      const remaining = reminderTime.getTime() - Date.now();
      if (remaining > browserTimerLimit) {
        timers.push(window.setTimeout(schedule, browserTimerLimit));
        return;
      }
      timers.push(window.setTimeout(() => {
        try {
          new Notification(
            language === "ar" ? "تذكير من TimeX" : "TimeX reminder",
            {
              body: language === "ar"
                ? `حان وقت مهمتك: ${task.title}`
                : `It's time for: ${task.title}`,
              tag: `timex-task-${task.id}`,
            },
          );
          onReminder(task.id);
        } catch (error) {
          console.error("TimeX could not display a task reminder.", error);
        }
      }, Math.max(0, remaining)));
    };
    schedule();
  }

  return () => timers.forEach((timer) => window.clearTimeout(timer));
}
