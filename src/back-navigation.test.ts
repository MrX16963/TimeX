import { describe, expect, it } from "vitest";
import { DOUBLE_BACK_EXIT_WINDOW_MS, isDoubleBackPress } from "./back-navigation";

describe("Android double-back exit", () => {
  it("exits only when the second press is within the confirmation window", () => {
    expect(isDoubleBackPress(1200, 1000)).toBe(true);
    expect(isDoubleBackPress(1000 + DOUBLE_BACK_EXIT_WINDOW_MS, 1000)).toBe(true);
    expect(isDoubleBackPress(1001 + DOUBLE_BACK_EXIT_WINDOW_MS, 1000)).toBe(false);
    expect(isDoubleBackPress(1000, null)).toBe(false);
  });
});
