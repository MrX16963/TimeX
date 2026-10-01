import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getReminderTime,
  notificationIdForTask,
  scheduleBrowserReminders,
} from "./reminders";

describe("scheduled task reminders", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("calculates reminders from the task's local start time", () => {
    const reminder = getReminderTime({
      id: "task-1",
      title: "Study",
      completed: false,
      scheduledDate: "2026-10-02",
      startTime: "09:30",
      reminderMinutes: 15,
    });

    expect(reminder?.getHours()).toBe(9);
    expect(reminder?.getMinutes()).toBe(15);
    expect(reminder?.getDate()).toBe(2);
  });

  it("does not produce a reminder for tasks without an alarm", () => {
    expect(
      getReminderTime({
        id: "task-2",
        title: "Read",
        completed: false,
        scheduledDate: "2026-10-02",
        startTime: "09:30",
        reminderMinutes: null,
      }),
    ).toBeNull();
  });

  it("generates stable positive IDs for native notifications", () => {
    const first = notificationIdForTask("task-1");
    expect(first).toBe(notificationIdForTask("task-1"));
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(0x7fffffff);
    expect(first).not.toBe(notificationIdForTask("task-2"));
  });

  it("notifies once at the selected lead time while the browser is open", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 2, 9, 14, 59));
    vi.stubGlobal("window", globalThis);
    const NotificationMock = vi.fn();
    vi.stubGlobal("Notification", Object.assign(
      function (title: string, options: NotificationOptions) {
        NotificationMock(title, options);
      },
      { permission: "granted" },
    ));
    const onReminder = vi.fn();
    const stop = scheduleBrowserReminders(
      [{
        id: "task-3",
        title: "Doctor",
        completed: false,
        scheduledDate: "2026-10-02",
        startTime: "09:30",
        reminderMinutes: 15,
      }],
      "en",
      onReminder,
    );

    vi.advanceTimersByTime(1000);

    expect(NotificationMock).toHaveBeenCalledWith("TimeX reminder", {
      body: "It's time for: Doctor",
      tag: "timex-task-task-3",
    });
    expect(onReminder).toHaveBeenCalledWith("task-3");
    stop();
  });
});
