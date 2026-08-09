export type ChatRole = "user" | "assistant";

export type ChatMessageStatus = "complete" | "streaming" | "error";

export type ChatSource = {
  title: string;
  type?: string;
  url?: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  status?: ChatMessageStatus;
  sources?: ChatSource[];
  grounded?: boolean;
};

export function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
