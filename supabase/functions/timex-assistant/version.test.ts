import { describe, expect, it } from "vitest";
import { isOutdatedClient, updateNotice, UPDATE_URL } from "./modes";

describe("client version gate", () => {
  it("flags missing and older versions", () => {
    expect(isOutdatedClient(undefined)).toBe(true);
    expect(isOutdatedClient("1.0.15")).toBe(true);
    expect(isOutdatedClient("1.0.16")).toBe(false);
    expect(isOutdatedClient("1.1.0")).toBe(false);
  });
  it("links to the website", () => {
    expect(updateNotice("ar")).toContain(UPDATE_URL);
    expect(updateNotice("en")).toContain(UPDATE_URL);
  });
});
