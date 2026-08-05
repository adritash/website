import type { ReactNode } from "react";
import Container from "@/components/ui/Container";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  containerClassName?: string;
  background?: "white" | "surface" | "dark" | "brand";
};

const backgrounds = {
  white: "bg-background",
  surface: "bg-surface",
  dark: "bg-surface-dark text-white",
  brand: "bg-brand text-white",
};

export default function Section({
  children,
  id,
  className = "",
  containerClassName = "",
  background = "white",
}: SectionProps) {
  return (
    <section
      id={id}
      className={`py-16 sm:py-20 lg:py-24 ${backgrounds[background]} ${id ? "section-anchor" : ""} ${className}`}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
