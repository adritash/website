"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ChatMessage } from "@/lib/ai/types";
import {
  AI_THINKING_STATUSES,
  AI_THINKING_STATUS_INTERVAL_MS,
} from "@/lib/ai/config";

type ChatMessageProps = {
  message: ChatMessage;
};

function ThinkingStatus() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % AI_THINKING_STATUSES.length);
    }, AI_THINKING_STATUS_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  const label = AI_THINKING_STATUSES[index] ?? AI_THINKING_STATUSES[0];

  return (
    <p className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
      <span className="inline-flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:300ms]" />
      </span>
      <span className="font-medium tracking-wide">{label}…</span>
    </p>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isStreaming = message.status === "streaming";
  const sources = message.sources ?? [];
  const showThinking = isStreaming && !message.content.trim();

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="listitem"
      aria-live={isStreaming ? "polite" : undefined}
    >
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-md bg-brand text-white"
            : isError
              ? "rounded-bl-md border border-red-300/40 bg-red-50 text-red-900 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-100"
              : "rounded-bl-md border border-border bg-surface-elevated text-foreground"
        }`}
      >
        {showThinking ? (
          <ThinkingStatus />
        ) : (
          <>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {isStreaming && (
              <span
                className="mt-1 inline-block h-4 w-0.5 animate-pulse bg-brand"
                aria-hidden="true"
              />
            )}
          </>
        )}
        {!isUser && !isStreaming && sources.length > 0 && (
          <div className="mt-3 border-t border-border/70 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Sources
            </p>
            <ul className="mt-1 space-y-1 text-xs text-muted">
              {sources.map((source) => (
                <li key={`${source.title}-${source.url ?? "plain"}`}>
                  {source.url ? (
                    <Link
                      href={source.url}
                      className="text-brand hover:text-brand-dark hover:underline"
                    >
                      {source.title}
                    </Link>
                  ) : (
                    <span>{source.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
