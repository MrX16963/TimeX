import type { ChatMessage } from "./cloud";
import { readChatMessages } from "./cloud";

export type ChatMode = "chat" | "plan" | "advanced-plan";

export type AssistantConversation = {
  id: string;
  title: string;
  mode: ChatMode;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type ConversationStore = {
  activeId: string;
  conversations: AssistantConversation[];
};

const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES_PER_CONVERSATION = 100;

export function createConversation(mode: ChatMode = "chat"): AssistantConversation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "",
    mode,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createConversationStore(
  key: string,
  legacyKey?: string,
): ConversationStore {
  try {
    const saved = window.localStorage.getItem(key);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isConversationStore(parsed)) {
        const conversations = parsed.conversations
          .filter(isConversation)
          .slice(0, MAX_CONVERSATIONS);
        if (conversations.length) {
          const activeId = conversations.some((item) => item.id === parsed.activeId)
            ? parsed.activeId
            : conversations[0].id;
          return { activeId, conversations };
        }
      }
    }
    const legacy = legacyKey ? readChatMessages(legacyKey) : [];
    const initial = createConversation();
    initial.messages = legacy.slice(-MAX_MESSAGES_PER_CONVERSATION);
    initial.title = conversationTitle(initial.messages);
    return { activeId: initial.id, conversations: [initial] };
  } catch {
    const initial = createConversation();
    return { activeId: initial.id, conversations: [initial] };
  }
}

export function saveConversationMessages(
  conversation: AssistantConversation,
  messages: ChatMessage[],
): AssistantConversation {
  const boundedMessages = messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
  return {
    ...conversation,
    title: conversation.title || conversationTitle(boundedMessages),
    messages: boundedMessages,
    updatedAt: new Date().toISOString(),
  };
}

export function isChatMode(value: unknown): value is ChatMode {
  return value === "chat" || value === "plan" || value === "advanced-plan";
}

function isConversationStore(value: unknown): value is ConversationStore {
  if (!value || typeof value !== "object") return false;
  const store = value as Partial<ConversationStore>;
  return typeof store.activeId === "string" && Array.isArray(store.conversations);
}

function isConversation(value: unknown): value is AssistantConversation {
  if (!value || typeof value !== "object") return false;
  const conversation = value as Partial<AssistantConversation>;
  return (
    typeof conversation.id === "string" &&
    typeof conversation.title === "string" &&
    isChatMode(conversation.mode) &&
    Array.isArray(conversation.messages) &&
    conversation.messages.every(isChatMessage) &&
    typeof conversation.createdAt === "string" &&
    typeof conversation.updatedAt === "string"
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    typeof message.created_at === "string" &&
    (message.sources === undefined ||
      (Array.isArray(message.sources) &&
        message.sources.every(
          (source) =>
            source &&
            typeof source.title === "string" &&
            typeof source.url === "string" &&
            source.url.startsWith("https://"),
        )))
  );
}

function conversationTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  return firstUserMessage?.content.trim().slice(0, 56) ?? "";
}
