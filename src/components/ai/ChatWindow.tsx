"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import ChatInput from "@/components/ai/ChatInput";
import ChatMessage from "@/components/ai/ChatMessage";
import { AI_QUICK_PROMPTS } from "@/lib/ai/quick-prompts";
import type { ChatMessage as ChatMessageType } from "@/lib/ai/types";

type ChatWindowProps = {
  messages: ChatMessageType[];
  input: string;
  isBusy: boolean;
  showQuickPrompts: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onQuickPrompt: (prompt: string) => void;
  onClose: () => void;
  onRetry?: () => void;
  hasError?: boolean;
};

export default function ChatWindow({
  messages,
  input,
  isBusy,
  showQuickPrompts,
  onInputChange,
  onSend,
  onQuickPrompt,
  onClose,
  onRetry,
  hasError = false,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isBusy]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adritash-ai-title"
    >
      <header className="flex items-start justify-between gap-3 border-b border-border bg-surface px-4 py-3.5">
        <div>
          <h2 id="adritash-ai-title" className="text-base font-semibold text-foreground">
            Adritash AI
          </h2>
          <p className="text-xs text-muted">AI architecture assistant</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close Adritash AI assistant"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-surface/40 px-3 py-4 sm:px-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.length === 0 && (
          <div className="rounded-xl border border-border bg-surface-elevated p-4 text-sm leading-relaxed text-muted">
            Ask about cloud modernization, enterprise architecture, AI solutions, or how
            Adritash can help your organization.
          </div>
        )}

        <div role="list" className="space-y-3">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>

        {showQuickPrompts && !isBusy && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {AI_QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onQuickPrompt(prompt)}
                  className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:border-brand/40 hover:bg-brand-light"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasError && onRetry && (
          <div className="rounded-lg border border-border bg-surface-elevated p-3 text-sm text-muted">
            <p>Sorry, I couldn&apos;t process that request. Please try again.</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Retry last message
            </button>
          </div>
        )}
      </div>

      <ChatInput value={input} onChange={onInputChange} onSend={onSend} disabled={isBusy} />

      <footer className="border-t border-border bg-surface px-4 py-2 text-center text-[11px] text-muted">
        <span>Adritash AI · Powered by Gemini</span>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        <Link
          href="/contact"
          className="font-medium text-brand hover:text-brand-dark"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("adritash-ai-contact-click"));
            }
          }}
        >
          Contact us
        </Link>
      </footer>
    </div>
  );
}
