import type { ChatMessage } from "@/lib/ai/types";
import Link from "next/link";

type ChatMessageProps = {
  message: ChatMessage;
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isStreaming = message.status === "streaming";
  const sources = message.sources ?? [];

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
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {isStreaming && (
          <span className="mt-1 inline-block h-4 w-0.5 animate-pulse bg-brand" aria-hidden="true" />
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
