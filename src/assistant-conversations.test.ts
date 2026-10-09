import { afterEach, describe, expect, it } from "vitest";
import {
  createConversation,
  createConversationStore,
  saveConversationMessages,
} from "./assistant-conversations";

describe("assistant conversation history", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("creates separate conversations with a selected mode", () => {
    const first = createConversation("plan");
    const second = createConversation("advanced-plan");

    expect(first.id).not.toBe(second.id);
    expect(first.mode).toBe("plan");
    expect(second.mode).toBe("advanced-plan");
  });

  it("loads valid saved conversations and selects a valid active conversation", () => {
    const conversation = createConversation();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => JSON.stringify({
            activeId: "missing",
            conversations: [conversation, { ...conversation, mode: "unknown" }],
          }),
        },
      },
    });

    expect(createConversationStore("timex-conversations")).toEqual({
      activeId: conversation.id,
      conversations: [conversation],
    });
  });

  it("migrates legacy messages into a titled conversation", () => {
    const legacyMessage = {
      id: "legacy-1",
      role: "user",
      content: "Help me plan a study schedule",
      created_at: "2026-10-01T17:00:00.000Z",
    };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) =>
            key === "old-chat" ? JSON.stringify([legacyMessage]) : null,
        },
      },
    });

    const store = createConversationStore("new-history", "old-chat");
    expect(store.conversations[0]).toMatchObject({
      mode: "chat",
      title: "Help me plan a study schedule",
      messages: [legacyMessage],
    });
  });

  it("updates the conversation title and caps stored messages", () => {
    const conversation = createConversation();
    const messages = Array.from({ length: 105 }, (_, index) => ({
      id: `message-${index}`,
      role: "user" as const,
      content: `Request ${index}`,
      created_at: new Date(index).toISOString(),
    }));

    const saved = saveConversationMessages(conversation, messages);
    expect(saved.messages).toHaveLength(100);
    expect(saved.messages[0]?.id).toBe("message-5");
    expect(saved.title).toBe("Request 5");
  });
});
