import type { Metadata } from "next";
import ExperienceTimeline from "@/components/sections/ExperienceTimeline";
import PageHero from "@/components/sections/PageHero";
import CTABand from "@/components/ui/CTABand";
import Section from "@/components/ui/Section";
import { experience } from "@/lib/data/experience";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Experience",
  description:
    "Career timeline of Dwaipayan Rajguru — 15+ years across SS&C, Accenture, Cognizant, and Hexaware in enterprise architecture and delivery.",
  path: "/experience",
});

export default function ExperiencePage() {
  return (
    <>
      <PageHero
        eyebrow="Experience"
        title="15+ years building enterprise technology"
        description="From implementation consultant to senior architect and programme leader — click each role to explore responsibilities and impact."
      />

      <Section background="white">
        <ExperienceTimeline entries={experience} />
      </Section>

      <CTABand
        title="Interested in my project work?"
        buttonLabel="View Projects"
        buttonHref="/projects"
      />
    </>
  );
}
