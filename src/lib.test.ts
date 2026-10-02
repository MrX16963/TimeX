import { describe, expect, it } from "vitest";
import {
  buildPlanSteps,
  DEFAULT_DATA,
  getQuadrant,
  getCalendarWeek,
  layoutCalendarTasks,
  readAppData,
  type Task,
} from "./lib";

describe("getQuadrant", () => {
  it("maps importance and urgency to the four Eisenhower quadrants", () => {
    expect(getQuadrant({ important: true, urgent: true })).toBe(0);
    expect(getQuadrant({ important: true, urgent: false })).toBe(1);
    expect(getQuadrant({ important: false, urgent: true })).toBe(2);
    expect(getQuadrant({ important: false, urgent: false })).toBe(3);
  });
});

describe("layoutCalendarTasks", () => {
  it("lays out overlapping appointments in separate columns", () => {
    const tasks: Task[] = [
      {
        id: "first",
        title: "First",
        important: false,
        urgent: false,
        completed: false,
        createdAt: 1,
        scheduledDate: "2026-10-02",
        startTime: "09:00",
        endTime: "11:00",
      },
      {
        id: "overlap",
        title: "Overlap",
        important: true,
        urgent: false,
        completed: false,
        createdAt: 2,
        scheduledDate: "2026-10-02",
        startTime: "09:30",
        endTime: "10:30",
      },
      {
        id: "next",
        title: "Next",
        important: false,
        urgent: true,
        completed: false,
        createdAt: 3,
        scheduledDate: "2026-10-02",
        startTime: "11:00",
        endTime: "12:00",
      },
    ];

    expect(layoutCalendarTasks(tasks).map(({ task, column, columns }) => ({
      id: task.id,
      column,
      columns,
    }))).toEqual([
      { id: "first", column: 0, columns: 2 },
      { id: "overlap", column: 1, columns: 2 },
      { id: "next", column: 0, columns: 1 },
    ]);
  });
});

describe("buildPlanSteps", () => {
  it("turns a goal into concrete planning steps", () => {
    const steps = buildPlanSteps("Learn conversational Spanish");
    expect(steps).toHaveLength(5);
    expect(steps[0]).toContain("Learn conversational Spanish");
    expect(steps[2]).toContain("recall");
  });

  it("does not create a plan for an empty goal", () => {
    expect(buildPlanSteps("  ")).toEqual([]);
  });

  it("creates localized next steps for Arabic goals", () => {
    const steps = buildPlanSteps("تعلّم اللغة الإسبانية", "ar");
    expect(steps).toHaveLength(5);
    expect(steps[0]).toContain("تعلّم اللغة الإسبانية");
  });

  it("tailors study plans around deadlines and active recall", () => {
    const steps = buildPlanSteps("Prepare for my certification exam");

    expect(steps[0]).toContain("deadline");
    expect(steps[2]).toContain("recall");
  });
});

describe("readAppData", () => {
  it("uses safe defaults for invalid persisted data", () => {
    expect(readAppData("{")).toEqual({
      tasks: [],
      notes: [],
      plans: [],
      points: 0,
      theme: "light",
      accentColor: "#e7e7e7",
      language: "ar",
    });
  });

  it("loads supported preferences and persisted content", () => {
    expect(
      readAppData(
        JSON.stringify({
          tasks: [{ id: "t1", title: "Read", important: true, urgent: false }],
          notes: [],
          plans: [],
          points: 40,
          theme: "sage",
          accentColor: "#3a9c78",
          language: "en",
        }),
      ),
    ).toMatchObject({ points: 40, theme: "sage", accentColor: "#3a9c78", language: "en" });
  });

  it("persists a personal accent color and safely rejects malformed colors", () => {
    expect(
      readAppData(JSON.stringify({ theme: "custom", accentColor: "#FF8A42" })),
    ).toMatchObject({ theme: "custom", accentColor: "#FF8A42" });
    expect(
      readAppData(JSON.stringify({ theme: "custom", accentColor: "red" })).accentColor,
    ).toBe(DEFAULT_DATA.accentColor);
  });

  it("preserves scheduled task dates, times, and reminder settings", () => {
    const task: Task = {
      id: "meeting",
      title: "Review",
      important: true,
      urgent: false,
      completed: false,
      createdAt: 1,
      scheduledDate: "2026-10-02",
      startTime: "09:15",
      endTime: "10:00",
      reminderMinutes: 15,
      color: "#6a9cff",
    };

    expect(readAppData(JSON.stringify({ tasks: [task] })).tasks).toEqual([task]);
  });

  it("builds a seven-day calendar strip starting on Sunday", () => {
    expect(getCalendarWeek("2026-10-01")).toEqual([
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
  });

  it("ignores malformed records in persisted collections", () => {
    expect(
      readAppData(JSON.stringify({ tasks: [null, { title: "missing fields" }] })).tasks,
    ).toEqual([]);
  });

  it("drops scheduled tasks with invalid date or time ranges", () => {
    const data = readAppData(JSON.stringify({
      tasks: [{
        id: "invalid-time",
        title: "Broken appointment",
        important: false,
        urgent: false,
        completed: false,
        createdAt: 1,
        scheduledDate: "2026-02-31",
        startTime: "25:70",
        endTime: "09:00",
        reminderMinutes: 10,
      }],
    }));

    expect(data.tasks).toEqual([]);
  });

  it("drops invalid task colors and preserves valid reminder intervals", () => {
    const baseTask = {
      id: "color-task",
      title: "Color",
      important: false,
      urgent: false,
      completed: false,
      createdAt: 1,
      scheduledDate: "2026-10-02",
      startTime: "09:00",
      endTime: "10:00",
    };

    expect(readAppData(JSON.stringify({
      tasks: [{ ...baseTask, reminderMinutes: 60, color: "#ab42ef" }],
    })).tasks).toHaveLength(1);
    expect(readAppData(JSON.stringify({
      tasks: [{ ...baseTask, reminderMinutes: 10, color: "blue" }],
    })).tasks).toEqual([]);
  });
});
