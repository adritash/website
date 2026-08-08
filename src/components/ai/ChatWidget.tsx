"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatWindow from "@/components/ai/ChatWindow";
import {
  WELCOME_BUBBLE_MAX_DELAY_MS,
  WELCOME_BUBBLE_MIN_DELAY_MS,
  WELCOME_BUBBLE_STORAGE_KEY,
  AI_SESSION_INTERACTION_KEY,
} from "@/lib/ai/config";
import { createMessageId, type ChatMessage } from "@/lib/ai/types";
import { trackAiEvent } from "@/lib/analytics/ai-events";

const GENERIC_ERROR =
  "Sorry, I couldn't process that request. Please try again.";

type StreamChunk =
  | { type: "token"; text: string }
  | { type: "complete"; reply: string; interactionId: string }
  | { type: "error"; message: string };

async function readSseStream(
  response: Response,
  onToken: (text: string) => void
): Promise<{ reply: string; interactionId: string }> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming is not supported in this browser.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  let interactionId = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const dataLine = line
        .split("\n")
        .find((entry) => entry.startsWith("data: "));

      if (!dataLine) continue;

      const payload = JSON.parse(dataLine.slice(6)) as StreamChunk;

      if (payload.type === "token" && payload.text) {
        reply += payload.text;
        onToken(payload.text);
      }

      if (payload.type === "complete") {
        reply = payload.reply || reply;
        interactionId = payload.interactionId;
      }

      if (payload.type === "error") {
        throw new Error(payload.message || GENERIC_ERROR);
      }
    }
  }

  if (!interactionId) {
    throw new Error("Streaming completed without an interaction identifier.");
  }

  return { reply: reply.trim() || GENERIC_ERROR, interactionId };
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [interactionId, setInteractionId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.sessionStorage.getItem(AI_SESSION_INTERACTION_KEY);
  });

  const lastUserMessageRef = useRef<string | null>(null);
  const welcomeTimerRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = window.localStorage.getItem(WELCOME_BUBBLE_STORAGE_KEY) === "true";

    if (dismissed) {
      return;
    }

    const delay =
      WELCOME_BUBBLE_MIN_DELAY_MS +
      Math.floor(
        Math.random() * (WELCOME_BUBBLE_MAX_DELAY_MS - WELCOME_BUBBLE_MIN_DELAY_MS)
      );

    welcomeTimerRef.current = window.setTimeout(() => {
      setShowWelcomeBubble(true);
      trackAiEvent("ai_widget_shown");
    }, delay);

    return () => {
      if (welcomeTimerRef.current) {
        window.clearTimeout(welcomeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleContactClick() {
      trackAiEvent("ai_contact_clicked");
    }

    window.addEventListener("adritash-ai-contact-click", handleContactClick);
    return () => {
      window.removeEventListener("adritash-ai-contact-click", handleContactClick);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const persistInteractionId = useCallback((id: string) => {
    setInteractionId(id);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(AI_SESSION_INTERACTION_KEY, id);
    }
  }, []);

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || isBusy) return;

      lastUserMessageRef.current = message;
      setHasError(false);
      setIsBusy(true);
      setInput("");

      const userMessageId = createMessageId();
      const assistantMessageId = createMessageId();

      setMessages((prev) => [
        ...prev,
        { id: userMessageId, role: "user", content: message, status: "complete" },
        { id: assistantMessageId, role: "assistant", content: "", status: "streaming" },
      ]);

      trackAiEvent("ai_message_sent", { length: message.length });

      try {
        const streamResponse = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            previousInteractionId: interactionId ?? undefined,
            stream: true,
          }),
        });

        if (!streamResponse.ok) {
          const errorData = (await streamResponse.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(errorData?.error || GENERIC_ERROR);
        }

        if (streamResponse.headers.get("content-type")?.includes("text/event-stream")) {
          const result = await readSseStream(streamResponse, (token) => {
            setMessages((prev) =>
              prev.map((entry) =>
                entry.id === assistantMessageId
                  ? { ...entry, content: `${entry.content}${token}` }
                  : entry
              )
            );
          });

          setMessages((prev) =>
            prev.map((entry) =>
              entry.id === assistantMessageId
                ? { ...entry, content: result.reply, status: "complete" }
                : entry
            )
          );
          persistInteractionId(result.interactionId);
          trackAiEvent("ai_response_received", { streaming: true });
          return;
        }

        const fallbackResponse = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            previousInteractionId: interactionId ?? undefined,
            stream: false,
          }),
        });

        const fallbackData = (await fallbackResponse.json()) as {
          reply?: string;
          interactionId?: string;
          error?: string;
        };

        if (!fallbackResponse.ok || !fallbackData.reply || !fallbackData.interactionId) {
          throw new Error(fallbackData.error || GENERIC_ERROR);
        }

        setMessages((prev) =>
          prev.map((entry) =>
            entry.id === assistantMessageId
              ? {
                  ...entry,
                  content: fallbackData.reply!,
                  status: "complete",
                }
              : entry
          )
        );
        persistInteractionId(fallbackData.interactionId!);
        trackAiEvent("ai_response_received", { streaming: false });
      } catch {
        setHasError(true);
        trackAiEvent("ai_response_error");
        setMessages((prev) =>
          prev.map((entry) =>
            entry.id === assistantMessageId
              ? { ...entry, content: GENERIC_ERROR, status: "error" }
              : entry
          )
        );
      } finally {
        setIsBusy(false);
      }
    },
    [interactionId, isBusy, persistInteractionId]
  );

  function openChat() {
    setShowWelcomeBubble(false);
    setIsOpen(true);
    trackAiEvent("ai_widget_opened");
  }

  function dismissWelcomeBubble() {
    setShowWelcomeBubble(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WELCOME_BUBBLE_STORAGE_KEY, "true");
    }
  }

  function handleRetry() {
    const lastMessage = lastUserMessageRef.current;
    if (!lastMessage) return;

    setMessages((prev) => {
      const lastAssistantIndex = [...prev]
        .map((message, index) => ({ message, index }))
        .reverse()
        .find((entry) => entry.message.role === "assistant")?.index;

      if (lastAssistantIndex === undefined) return prev;
      return prev.slice(0, lastAssistantIndex);
    });

    void sendMessage(lastMessage);
  }

  const showQuickPrompts = messages.length === 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end p-4 sm:p-5">
      <div className="pointer-events-auto flex w-full max-w-[420px] flex-col items-end gap-3">
        {showWelcomeBubble && !isOpen && (
          <div className="relative max-w-[min(100%,320px)] rounded-2xl border border-border bg-surface-elevated p-4 text-sm leading-relaxed text-foreground shadow-lg">
            <button
              type="button"
              onClick={dismissWelcomeBubble}
              className="absolute right-2 top-2 rounded-md p-1 text-muted hover:bg-surface hover:text-foreground"
              aria-label="Dismiss welcome message"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <p className="pr-6">
              Hi! I&apos;m Adritash AI. I can help you explore cloud, AI, application
              architecture and modernization.
            </p>
            <button
              type="button"
              onClick={openChat}
              className="mt-3 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Start chatting →
            </button>
          </div>
        )}

        {isOpen && (
          <div
            ref={panelRef}
            className="fixed inset-0 z-50 flex flex-col bg-background sm:static sm:inset-auto sm:h-[min(72vh,600px)] sm:w-full sm:max-w-[400px]"
          >
            <ChatWindow
              messages={messages}
              input={input}
              isBusy={isBusy}
              showQuickPrompts={showQuickPrompts}
              onInputChange={setInput}
              onSend={() => void sendMessage(input)}
              onQuickPrompt={(prompt) => {
                if (prompt.toLowerCase().includes("consultation")) {
                  trackAiEvent("ai_booking_clicked");
                }
                void sendMessage(prompt);
              }}
              onClose={() => setIsOpen(false)}
              onRetry={handleRetry}
              hasError={hasError}
            />
          </div>
        )}

        {!isOpen && (
          <button
            type="button"
            onClick={openChat}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open Adritash AI assistant"
            aria-expanded={isOpen}
          >
            <span aria-hidden="true">AI</span>
          </button>
        )}
      </div>
    </div>
  );
}
