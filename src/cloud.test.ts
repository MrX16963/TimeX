import { afterEach, describe, expect, it } from "vitest";
import { createLocalId, readChatMessages, type ChatMessage } from "./cloud";

describe("assistant conversation storage", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("keeps conversation history in the requested account-specific storage key", () => {
    const message: ChatMessage = {
      id: "message-1",
      role: "assistant",
      content: "Welcome back, Sam.",
      created_at: "2026-10-01T17:00:00.000Z",
    };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => key === "timex-chat:user-1" ? JSON.stringify([message]) : null,
        },
      },
    });

    expect(readChatMessages("timex-chat:user-1")).toEqual([message]);
    expect(readChatMessages("timex-chat:user-2")).toEqual([]);
  });

  it("ignores malformed chat records in local storage", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => JSON.stringify([
            { role: "system", content: "bad" },
            { id: "valid", role: "user", content: "Hello", created_at: "2026-10-01" },
          ]),
        },
      },
    });

    expect(readChatMessages("timex-chat")).toMatchObject([
      { id: "valid", role: "user", content: "Hello" },
    ]);
  });

  it("creates a fresh local conversation identifier", () => {
    expect(createLocalId()).toEqual(expect.any(String));
    expect(createLocalId()).not.toEqual(createLocalId());
  });
});
