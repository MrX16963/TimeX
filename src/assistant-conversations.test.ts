import { afterEach, describe, expect, it } from "vitest";
import {
  createConversation,
  createConversationStore,
  latestSearchContext,
  MAX_CONVERSATIONS,
  normalizeChatMode,
  saveConversationMessages,
  toCloudMode,
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
    const third = createConversation("gemini");

    expect(first.id).not.toBe(second.id);
    expect(first.mode).toBe("plan");
    expect(second.mode).toBe("advanced-plan");
    expect(third.mode).toBe("gemini");
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

  it("keeps only the 15 most recent conversations and migrates legacy modes", () => {
    const conversations = Array.from({ length: 18 }, (_, index) => ({
      ...createConversation(index === 0 ? "gemini" : "chat"),
      updatedAt: new Date(2026, 9, 1, 0, index).toISOString(),
    }));
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => JSON.stringify({ activeId: conversations[17].id, conversations }),
        },
      },
    });

    const store = createConversationStore("timex-conversations");
    expect(store.conversations).toHaveLength(MAX_CONVERSATIONS);
    expect(store.conversations[0].id).toBe(conversations[17].id);
    expect(store.conversations.some((item) => item.id === conversations[0].id)).toBe(false);
    expect(normalizeChatMode("gemini")).toBe("groq");
    expect(normalizeChatMode("deepseek")).toBe("groq");
    expect(normalizeChatMode("advanced-plan")).toBe("mrx_planner");
    expect(normalizeChatMode("plan")).toBe("chat");
    expect(normalizeChatMode("mrx_search")).toBe("mrx_search");
    expect(normalizeChatMode("nonsense")).toBe("chat");
  });

  it("stores new modes in the cloud as a database-safe value", () => {
    expect(toCloudMode("groq")).toBe("chat");
    expect(toCloudMode("mrx_planner")).toBe("chat");
    expect(toCloudMode("plan")).toBe("plan");
  });

  it("passes the latest MrX Search answer to the planner as context", () => {
    const search = {
      ...createConversation("mrx_search"),
      title: "Pomodoro research",
      updatedAt: "2026-10-02T10:00:00.000Z",
      messages: [
        { id: "1", role: "user" as const, content: "Pomodoro?", created_at: "2026-10-02T10:00:00.000Z" },
        { id: "2", role: "assistant" as const, content: "25-minute focus blocks.", created_at: "2026-10-02T10:00:01.000Z" },
      ],
    };
    const planner = createConversation("mrx_planner");

    expect(latestSearchContext([planner, search], planner.id)).toBe(
      "Topic: Pomodoro research\n25-minute focus blocks.",
    );
    expect(latestSearchContext([planner], planner.id)).toBe("");
    expect(latestSearchContext([search], search.id)).toBe("");
  });
});

