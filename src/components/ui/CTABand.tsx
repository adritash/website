import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

type CTABandProps = {
  title: string;
  description?: string;
  buttonLabel: string;
  buttonHref: string;
  variant?: "light" | "brand" | "dark";
  children?: ReactNode;
};

const variants = {
  light: "bg-brand-light border border-indigo-100 dark:border-indigo-900",
  brand: "bg-brand text-white",
  dark: "bg-surface-dark text-white",
};

export default function CTABand({
  title,
  description,
  buttonLabel,
  buttonHref,
  variant = "light",
  children,
}: CTABandProps) {
  const isDark = variant === "brand" || variant === "dark";

  return (
    <section className={`py-12 sm:py-16 ${variants[variant]}`}>
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <h2
              className={`text-2xl font-bold tracking-tight sm:text-3xl ${
                isDark ? "text-white" : "text-foreground"
              }`}
            >
              {title}
            </h2>
            {description && (
              <p
                className={`mt-3 text-base leading-relaxed ${
                  isDark ? "text-indigo-100" : "text-muted"
                }`}
              >
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              href={buttonHref}
              variant={isDark ? "inverse" : "primary"}
            >
              {buttonLabel}
            </Button>
            {children}
          </div>
        </div>
      </Container>
    </section>
  );
}
