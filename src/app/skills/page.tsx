import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import Badge from "@/components/ui/Badge";
import CTABand from "@/components/ui/CTABand";
import Section from "@/components/ui/Section";
import { skillCategories } from "@/lib/data/skills";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Skills",
  description:
    "Technical and leadership skills of Dwaipayan Rajguru — enterprise architecture, cloud, AI, programming, databases, DevOps, and programme delivery.",
  path: "/skills",
});

export default function SkillsPage() {
  return (
    <>
      <PageHero
        eyebrow="Skills"
        title="Technical expertise and leadership capabilities"
        description="Categorised by domain — from enterprise architecture and cloud to AI, programming, and programme delivery."
      />

      <Section background="white">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {skillCategories.map((category) => (
            <article
              key={category.id}
              id={category.id}
              className="section-anchor rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-xl font-semibold text-foreground">{category.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {category.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <Badge key={skill} variant="brand">
                    {skill}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <CTABand
        title="See these skills in action"
        buttonLabel="View Projects"
        buttonHref="/projects"
      />
    </>
  );
}
