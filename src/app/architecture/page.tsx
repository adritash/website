import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import ArchitectureDashboard from "@/components/sections/ArchitectureDashboard";
import CTABand from "@/components/ui/CTABand";
import Section from "@/components/ui/Section";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Reference Architectures",
  description:
    "End-to-end cloud reference architectures for FinTech billing, financial reporting, AI stock monitoring agents, and ledger validation — on AWS and GCP.",
  path: "/architecture",
});

export default function ArchitecturePage() {
  return (
    <>
      <PageHero
        eyebrow="Architecture"
        title="Reference designs for real-world workloads"
        description="Click each architecture to explore the full end-to-end cloud stack — layers, services, data flows, and key design decisions."
      />

      <Section background="white">
        <ArchitectureDashboard />
      </Section>

      <CTABand
        title="Want to discuss a similar architecture?"
        buttonLabel="Get in Touch"
        buttonHref="/contact"
      />
    </>
  );
}
