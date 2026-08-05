import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export default function Card({
  children,
  className = "",
  hover = true,
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface-elevated p-6 sm:p-7 ${
        hover
          ? "transition-all hover:border-indigo-200 hover:shadow-md dark:hover:border-indigo-800"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
