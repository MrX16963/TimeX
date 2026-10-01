import { describe, expect, it } from "vitest";
import { buildPlanSteps, getQuadrant, readAppData } from "./lib";

describe("getQuadrant", () => {
  it("maps importance and urgency to the four Eisenhower quadrants", () => {
    expect(getQuadrant({ important: true, urgent: true })).toBe(0);
    expect(getQuadrant({ important: true, urgent: false })).toBe(1);
    expect(getQuadrant({ important: false, urgent: true })).toBe(2);
    expect(getQuadrant({ important: false, urgent: false })).toBe(3);
  });
});

describe("buildPlanSteps", () => {
  it("turns a goal into concrete planning steps", () => {
    const steps = buildPlanSteps("Learn conversational Spanish");
    expect(steps).toHaveLength(5);
    expect(steps[0]).toContain("Learn conversational Spanish");
    expect(steps[3]).toContain("smallest useful next step");
  });

  it("does not create a plan for an empty goal", () => {
    expect(buildPlanSteps("  ")).toEqual([]);
  });

  it("creates localized next steps for Arabic goals", () => {
    const steps = buildPlanSteps("تعلّم اللغة الإسبانية", "ar");
    expect(steps).toHaveLength(5);
    expect(steps[0]).toContain("تعلّم اللغة الإسبانية");
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
          language: "en",
        }),
      ),
    ).toMatchObject({ points: 40, theme: "sage", language: "en" });
  });

  it("ignores malformed records in persisted collections", () => {
    expect(
      readAppData(JSON.stringify({ tasks: [null, { title: "missing fields" }] })).tasks,
    ).toEqual([]);
  });
});
