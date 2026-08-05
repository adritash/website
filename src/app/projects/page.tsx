import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import ProjectCard from "@/components/sections/ProjectCard";
import CTABand from "@/components/ui/CTABand";
import Section from "@/components/ui/Section";
import { projects } from "@/lib/data/projects";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Projects",
  description:
    "Enterprise technology programmes led by Dwaipayan Rajguru — cloud transformation, AI platforms, and infrastructure automation.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Projects"
        title="Programmes I've led and their outcomes"
        description="Each engagement is different. These examples show the problems I solve and the impact that matters."
      />

      <Section background="white">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-1">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </Section>

      <CTABand
        title="Want to discuss a similar challenge?"
        buttonLabel="Get in Touch"
        buttonHref="/contact"
      />
    </>
  );
}
